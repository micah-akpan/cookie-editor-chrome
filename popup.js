const cookieKey = document.getElementById('tb-cookie-key')
const getCookieBtn = document.getElementById('btn-get-cookie')

const cookieIndex = document.getElementById('tb-cookie-index')
const newCookieValue = document.getElementById('tb-cookie-value')

const cookieCopyMsg = document.getElementById('cookie-copy-msg')
const cookieHostURL = document.getElementById('tb-cookie-host-url')

const cookieURLSaveCheckbox = document.getElementById('cb-cookie-save')

document.forms.item(0).addEventListener('submit', async (e) => {
  e.preventDefault()
  const canSaveHostURL = cookieURLSaveCheckbox.checked
  await saveCookieHostURL(canSaveHostURL)
  await getNewCookieValue()
})

const COOKIE_HOST_URL = 'cookieHostURL'

window.addEventListener('load', async () => {
  try {
    const cookieHostURL = await chrome.storage.local.get([COOKIE_HOST_URL])
    if (cookieHostURL.cookieHostURL) {
      cookieURLSaveCheckbox.setAttribute('checked', true)
      cookieHostURL.value = cookieHostURL.cookieHostURL
    }
  } catch (error) {}
})

function getNewCookieElem() {
  if (!navigator.clipboard) {
    const getCookieBtnText = document.getElementById('text-new-cookie')
    getCookieBtnText.classList.add('show-block')
    return getCookieBtnText
  }

  const newCookieBtn = document.getElementById('btn-new-cookie')
  newCookieBtn.classList.add('show-block')

  newCookieBtn.addEventListener('click', (e) => {
    copyCookieToClipboard(e.target.textContent.trim())
  })

  return newCookieBtn
}


async function getCookie(cookieHostURL, cookieName) {
  const cookie = await chrome.cookies.get({
    url: cookieHostURL,
    name: cookieName
  })

  return cookie.value
}


async function getNewCookieValue() {
  const cookieHostURLValue = await chrome.storage.local.get(['cookieHostURL'])

  let cookieToBeChanged = ''

  try {
    if (cookieHostURLValue.cookieHostURL) {
      const sanitizedCookieHostURLValue = cookieHostURLValue.cookieHostURL.trim()
      const cookie = await getCookie(sanitizedCookieHostURLValue, cookieKey.value)
      cookieToBeChanged = cookie
    } else {
      const cookie = await getCookie(cookieHostURL.value.trim(), cookieKey.value)
      cookieToBeChanged = cookie
    }
  } catch (error) {
    // console.error('error: ', error)
  }

  const mutatedCookie = mutate(cookieToBeChanged, cookieIndex.value, newCookieValue.value)

  const newCookieValueElem = newCookieValue.insertAdjacentElement('afterend', getNewCookieElem())
  newCookieValueElem.textContent = `${mutatedCookie}`

}

/**
 * @description it changes the `index`th value of `cookie` to `newValue`
 * @param {string} cookie 
 * @param {number} index 
 * @param {any} newValue 
 * @returns {string}
 */
function mutate(cookie, index, newValue) {
  return cookie.substring(0, index) + newValue + cookie.substring(+index + 1)
}

/**
 * @description Copies the newly constructed cookie to Clipboard
 * @param {String} cookie
 * @returns {Promise<boolean>} Returns true if copy operation was successful, false otherwise
 */
async function copyCookieToClipboard(cookie) {
  if (cookie) {
    try {
      await navigator.clipboard.writeText(cookie)
      cookieCopyMsg.classList.replace('hide-block', 'show-block')
      return true
    } catch (error) {
      cookieCopyMsg.classList.add('copy-error')
      cookieCopyMsg.innerHTML = '<strong>Copy Failed 😢.</strong>'
    }
  }
  return false
}

/**
 * 
 * @description saves the cookie Host URL for later use
 * @param {boolean} canSaveHostURL
 * @returns {Promise<void>}
 */
async function saveCookieHostURL(canSaveHostURL) {
  const cookieHostURLValue = cookieHostURL.value.trim()

  if (canSaveHostURL) {
    if (cookieHostURLValue) {
      await chrome.storage.local.set({ cookieHostURL: cookieHostURLValue })
    } else {
      throw new Error('Please provide a cookie host URL')
    }
  } else {
    const cookieHostURL = await getStoredCookieHostURL()
    if (cookieHostURL) {
      await chrome.storage.local.remove('cookieHostURL')
    }
  }
}

/**
 * @description gets the stored cookie host URL
 * @returns {Promise<string>}
 */
async function getStoredCookieHostURL() {
  const cookieHostURLValue = await chrome.storage.local.get([COOKIE_HOST_URL])
  return cookieHostURLValue.cookieHostURL
}

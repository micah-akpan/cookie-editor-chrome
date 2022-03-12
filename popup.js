const cookieKey = document.getElementById('tb-cookie-key')
const getCookieBtn = document.getElementById('btn-get-cookie')

const cookieIndex = document.getElementById('tb-cookie-index')
const newCookieValue = document.getElementById('tb-cookie-value')

const cookieCopyMsg = document.getElementById('cookie-copy-msg')
const cookieHostURLElem = document.getElementById('tb-cookie-host-url')

const cookieURLSaveCheckbox = document.getElementById('cb-cookie-save')
const cookieTextError = document.getElementById('text-cookie-error')

const overwriteCookieCheckBox = document.getElementById('cb-cookie-overwrite-old')

const COOKIE_HOST_URL = 'cookieHostURL'

document.forms.item(0).addEventListener('submit', async (e) => {
  e.preventDefault()
  cookieCopyMsg.textContent = ''
  try {
    const canSaveHostURL = cookieURLSaveCheckbox.checked
    await saveOrClearCookieHostURL(canSaveHostURL)

    const updatedCookie = await getNewCookieValue()
    setUpdatedCookieValue(updatedCookie)

    const cookieName = getCookieName()
    const cookieHostURL = getCookieHostURL()

    const cookie = await getCookie(cookieHostURL, cookieName)
    const parsedCurrentCookie = JSON.parse(JSON.stringify(cookie))

    const allowListOfCookiePropsObj = getAllowListOfCookieProps(parsedCurrentCookie)

    // overwrite cookie if enabled
    if (overwriteCookieCheckBox.checked) {
      await chrome.cookies.set({
          ...allowListOfCookiePropsObj,
          url: cookieHostURL,
          name: cookieName,
          value: updatedCookie,
      })
    }
  } catch (error) {
    cookieTextError.innerHTML = error.message
  }
})

window.addEventListener('load', async () => {
  try {
    const cookieHostURL = await chrome.storage.local.get([COOKIE_HOST_URL])
    if (cookieHostURL.cookieHostURL) {
      cookieURLSaveCheckbox.setAttribute('checked', true)
      cookieHostURLElem.value = cookieHostURL.cookieHostURL
    }
  } catch (error) {
    cookieTextError.innerHTML = error.message
  }
})

chrome.cookies.onChanged.addListener(
  () => {
    cookieCopyMsg.classList.add('show-block')
    cookieCopyMsg.innerHTML = 'You now have the new cookie in store!'
  }
)

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

function getAllowListOfCookieProps(cookieObj) {
  const allowPropsList = ['domain', 'expirationDate', 'httpOnly', 'name', 'path', 'sameSite', 'secure', 'storeId', 'url', 'value']

  const allowPropsObj = {}
  allowPropsList.forEach((item) => {
    allowPropsObj[item] = cookieObj[item]
  })

  return allowPropsObj
}
 

async function getCookie(cookieHostURL, cookieName) {
  const cookie = await chrome.cookies.get({
    url: cookieHostURL,
    name: cookieName
  })

  if (cookie === null) {
    throw new Error(`There's probably no cookie with the name in the specified domain: ${cookieName}`)
  }

  return cookie
}

function getCookieName() {
  return cookieKey.value
}

function getCookieHostURL() {
  return cookieHostURLElem.value
}


function setUpdatedCookieValue(newCookie) {
  const newCookieValueElem = newCookieValue.insertAdjacentElement('afterend', getNewCookieElem())
  newCookieValueElem.textContent = newCookie
}


async function getNewCookieValue() {
  const cookieHostURLValue = await chrome.storage.local.get(['cookieHostURL'])

  let cookieToBeChanged = ''

  if (cookieHostURLValue.cookieHostURL) {
    const sanitizedCookieHostURLValue = cookieHostURLValue.cookieHostURL.trim()
    const cookie = await getCookie(sanitizedCookieHostURLValue, cookieKey.value)
    cookieToBeChanged = cookie.value
  } else {
    // no stored cookie, use the one from the input field
    const cookie = await getCookie(cookieHostURLElem.value.trim(), cookieKey.value)
    cookieToBeChanged = cookie.value
  }

  const mutatedCookie = mutate(cookieToBeChanged, cookieIndex.value, newCookieValue.value)

  return mutatedCookie

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
      cookieCopyMsg.innerHTML = '<strong>Copied!</strong>'
      return true
    } catch (error) {
      cookieCopyMsg.classList.add('error')
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
async function saveOrClearCookieHostURL(canSaveHostURL) {
  const cookieHostURLValue = cookieHostURLElem.value.trim()

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

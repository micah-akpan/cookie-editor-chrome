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
  await getCookieValue()
})

window.addEventListener('load', () => {
  chrome.storage.local.get(['cookieHostURL']).then((v) => {
    console.error('v: ', v.cookieHostURL)
    if (v.cookieHostURL && v.cookieHostURL.trim()) {
      cookieURLSaveCheckbox.setAttribute('checked', true)
      cookieHostURL.value = v.cookieHostURL.trim()
    }
  })
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


async function getCookieValue() {
  const cookieHostURLValue = await chrome.storage.local.get(['cookieHostURL'])

  let cookieToBeChanged = ''

  if (cookieHostURLValue.cookieHostURL) {
    const sanitizedCookieHostURLValue = cookieHostURLValue.cookieHostURL.trim()

    try {
      const cookie = await chrome.cookies.get({
        url: sanitizedCookieHostURLValue,
        name: cookieKey.value
      })

      cookieToBeChanged = cookie.value
  
    } catch (error) {
      // console.error('error: ', error)
    }
  } else {
    // no stored cookie host URL, use the entered URL
    const cookie = await chrome.cookies.get({
      url: cookieHostURL.value.trim(),
      name: cookieKey.value
    })

    cookieToBeChanged = cookie.value
  }

  const mutatedCookie = mutate(cookieToBeChanged, cookieIndex.value, newCookieValue.value)
  
  const newCookieValueElem = newCookieValue.insertAdjacentElement('afterend', getNewCookieElem())
  newCookieValueElem.textContent = `${mutatedCookie}`

}

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
      console.error('cookie deleted....')
      console.error('nothin', await getStoredCookieHostURL())
    }
  }
}

async function getStoredCookieHostURL() {
  const cookieHostURLValue = await chrome.storage.local.get(['cookieHostURL'])
  return cookieHostURLValue.cookieHostURL
}


/**
 * flow
 * user enters url, and click on save for future use
 * if there's a saved url in store, keep 'save cookie checkbox' in checked
 *   and pre-fill the url with url host input field with the existing cookie host url
 *   and keep the field in disabled state
 *   when user clicks on this button, show the input field, and the checkbox again
 * else
 *  proceed with existing flow
 * features:
 *   - user should be able to change domain
 */

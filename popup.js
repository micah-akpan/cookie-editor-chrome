const cookieKey = document.getElementById('tb-cookie-key')
const getCookieBtn = document.getElementById('btn-get-cookie')

const cookieIndex = document.getElementById('tb-cookie-index')
const newCookieValue = document.getElementById('tb-cookie-value')

const cookieCopyMsg = document.getElementById('cookie-copy-msg')
const cookieHostURL = document.getElementById('tb-cookie-host-url')

const cookieURLSaveCheckbox = document.getElementById('cb-cookie-save')

getCookieBtn.addEventListener('click', getCookieValue)

cookieURLSaveCheckbox.addEventListener('change', saveCookieHostURL)


function getNewCookieElem() {
  if (!navigator.clipboard) {
    const getCookieBtnText = document.createElement('p')
    getCookieBtnText.classList.add('text-new-cookie')
    return getCookieBtnText
  }

  const newCookieBtn = document.createElement('button')
  newCookieBtn.classList.add('btn-new-cookie')
  newCookieBtn.addEventListener('click', (e) => {
    copyCookieToClipboard(e.target.textContent.trim())
  })

  return newCookieBtn
}


async function getCookieValue() {
  const cookieHostURLValue = await chrome.storage.local.get(['cookieHostURL'])

  const sanitizedCookieHostURLValue = cookieHostURLValue.cookieHostURL.trim()

  try {
    const cookie = await chrome.cookies.get({
      url: sanitizedCookieHostURLValue,
      name: cookieKey.value
    })

    const mutatedCookie = mutate(cookie.value, cookieIndex.value, newCookieValue.value)
    const newCookieValueElem = newCookieValue.insertAdjacentElement('afterend', getNewCookieElem())
    newCookieValueElem.textContent = `${mutatedCookie}`

  } catch (error) {
    // console.error('error: ', error)
  }
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

async function saveCookieHostURL(e) {
  const canSave = e.target.checked
  const cookieHostURLValue = cookieHostURL.value.trim()

  if (canSave) {
    if (cookieHostURLValue) {
      await chrome.storage.local.set({ cookieHostURL: cookieHostURLValue })
    } else {
      throw new Error('Please provide a cookie host URL')
    }
  }
}

// new features
// user should be able to enter the domain
// user should be able to save domain for future use
// user should be able to change domain


/**
 * flow
 * user enters url, and click on save for future use
 * if this is turned on, display button with the title 'Change cookie url'
 *   when user clicks on this button, show the input field, and the checkbox again
 * else
 *  proceed with existing flow
 */
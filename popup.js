const cookieKey = document.querySelector('.cookie-key')
const getCookieBtn = document.querySelector('.btn-get-cookie')

const index = document.querySelector('.cookie-index')
const newValue = document.querySelector('.cookie-value')

const cookieCopyMsg = document.querySelector('.cookie-copy-msg')
const cookieHostURL = document.getElementById('tb-cookie-host-url')

const cookieURLSaveCheckbox = document.getElementById('cb-cookie-save')

getCookieBtn.addEventListener('click', getCookieValue)

cookieURLSaveCheckbox.addEventListener('change', saveCookieHostURL)


const getNewCookieElem = () => {
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

  if (!cookieHostURLValue.cookieHostURL.trim()) {
    // TODO: handle this with HTML form validation?
    throw new Error('Please provide a cookie host URL')
  }

  try {
    const cookie = await chrome.cookies.get({
      url: cookieHostURLValue.cookieHostURL.trim(),
      name: cookieKey.value
    })

    const mutatedCookie = mutate(cookie.value, index.value, newValue.value)
    const newCookieValueElem = newValue.insertAdjacentElement('afterend', getNewCookieElem())
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
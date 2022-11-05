// ==UserScript==
// @name         ProtonMail Auto Logout
// @namespace    http://tampermonkey.net/
// @version      2022.11.03
// @description  ProtonMail Auto Logout
// @author       Dmitry Frank
// @match        https://mail.proton.me/*
// @match        https://account.proton.me/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const EXPIRY_HOURS = 16;
  const EXPIRY_MS = 1000*60*60*EXPIRY_HOURS;

  // If you only want auto-logout to be active for certain email addresses,
  // mention them in this array. An empty array means all accounts are affected
  // by auto-logout.
  const EMAILS = [];

  let userEmail = "";

  let now = new Date().getTime();

  function getCookie(cName) {
    const name = cName + "=";
    const cDecoded = decodeURIComponent(document.cookie);
    const cArr = cDecoded .split('; ');
    let res;
    cArr.forEach(val => {
      if (val.indexOf(name) === 0) res = val.substring(name.length);
    })
    return res;
  }

  function getLoginTime() {
    let lt = getCookie("myLoginTime")*1;
    if (isNaN(lt)) {
      lt = 0;
    }

    return lt
  }

  function setLoginTime(lt) {
    document.cookie = "myLoginTime="+lt+"; domain=proton.me";
  }

  // Takes duration in milliseconds, and returns a string like "1h2m".
  // For negative durations, "0s" will be returned.
  function durToStr(dur) {
    dur = Math.round(dur/1000);

    // For negative durations, just use 0
    if (dur < 0) {
      dur = 0;
    }

    // If there is a minute or less, just return number of seconds
    if (dur <= 60) {
      return dur + "s";
    }

    // Otherwise, ignore seconds
    let minsTotal = Math.round(dur/60);
    let mins = minsTotal % 60;
    let hours = (minsTotal-mins) / 60;

    return hours + "h" + mins + "m";
    }

    if (document.URL.startsWith("https://mail.proton.me/login") && getLoginTime() == 0) {
      setLoginTime(now);
      console.log("detected login");
      // NOTE: we do not want to return here, because this page transitions to
      // the normal /u/X/inbox path without reloading the page, so the script
      // will keep working.
    }

    let startTime = getLoginTime()

    // If we're not logged in, don't do anything
    if (startTime == 0) {
      console.log("not logged in")
      return
    }

    let expiryTime = startTime + EXPIRY_MS;

    function getDropdown() {
      return document.querySelector('[data-testid="heading:userdropdown"]');
    }

    function getLogoutBtn() {
      return document.querySelector('[data-testid="userdropdown:button:logout"]');
    }

    function getLoginForm() {
    return document.querySelector('form[name="loginForm"]');
}

// Tries to detect if we're not logged in by just trying to find the login
// form on the page. If login form is found, returns true; otherwise, returns
// false.
function checkIfLoggedOut() {
  if (getLoginForm() == null) {
    return false
  }

  // Looks like we have the login form, therefore we're not logged in right now.

  console.log("detected logout")
  setLoginTime(0);

  return true
}

function logoutIfItIsTime() {
  let curTime = new Date().getTime();
  if (curTime < expiryTime) {
    return;
  }

  // Time to log out
  console.log("Logging out now");

  let logoutBtn = getLogoutBtn()
  if (logoutBtn == null) {
    let dropdown = getDropdown()
    if (dropdown == null) {
      console.log("Time to log out, but can't find dropdown element");
      return
    }

    dropdown.click();

    logoutBtn = getLogoutBtn()
  }

  if (logoutBtn == null) {
    console.log("Time to log out, but can't find logout button element even after clicking on a dropdown");
    return
  }

  // Now we try to log out; we primarily rely on clicking the logout button,
  // but also, just in case, clear the local storage and session storage as
  // well.
  //
  // NOTE: unfortunately clearing storage like that isn't sufficient in most
  // cases, since protonmail has this storage on both domains mail.proton.me
  // and account.proton.me, and if the user is at mail.proton.me (which is
  // the case most of the time), we'd only clear storage for that domain, and
  // the next time we open it, it would redirect to account.proton.me, which
  // still has data in the storage, and we'll reauthorize again automatically.
  // It potentially could be solved using an iframe (so opening
  // mail.proton.me would also open an invisible iframe opening
  // account.proton.me as well), but that kinda smells too much.
  localStorage.clear();
  sessionStorage.clear();

  logoutBtn.click();
}

function steppedDur(dur) {
  // When less than 10s, step is 1s
  if (dur <= 10*1000) {
    return dur;
  }

  // When less than 1m, step is 10s
  if (dur <= 60*1000) {
    return dur - dur%(10*1000);
  }

  // When less than 5m, step is 1m
  if (dur <= 60*5*1000) {
    return dur - dur%(60*1000);
  }

  // When less than 1h, step is 10m
  if (dur <= 60*60*1000) {
    return dur - dur%(600*1000);
  }

  // When 1h or more, step is 1h
  return dur - dur%(60*60*1000);
}

let lastPrintedStepped = steppedDur(expiryTime-now);

function printStats() {
  let left = expiryTime - new Date().getTime();

  let leftStepped = steppedDur(left)
  if (leftStepped != lastPrintedStepped) {
    console.log("Auto-logout in " + durToStr(left));
    lastPrintedStepped = leftStepped;
  }
}

function checkUserEmail() {
  let objs = document.getElementsByClassName("user-dropdown-email");
  if (objs.length != 1) {
    // Still can't find user email
    return;
  }

  // Found user email.
  userEmail = objs[0].innerText;

  // Now check if auto-logout should be active for that email.
  let shouldActivate = false;
  if (EMAILS.length == 0 || EMAILS.includes(userEmail)) {
    // This is an email we want to use auto-logout for
    shouldActivate = true;
  }

  if (!shouldActivate) {
    console.log("Auto-logout is not active for this account");
    clearInterval(logoutInterval);
    return;
  }

  console.log("Auto-logout is active for this account");
  console.log("Auto-logout in " + durToStr(expiryTime - now) + " (at "+ new Date(expiryTime) + ")");
}

let logoutInterval = setInterval(() => {
  // If we don't yet know user email, try to find it out.
  if (userEmail == "") {
    checkUserEmail();
    return;
  }

  printStats();

  if (checkIfLoggedOut()) {
    clearInterval(logoutInterval);
    return
  }

  logoutIfItIsTime();
}, 1000);
})();

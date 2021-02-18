"use strict";

//////////////////////////////////////////////////////
// USER DATA
const account1 = {
    owner: "Jonas Schmedtmann",
    movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
    movementsDates: [
        "2019-01-28T09:15:04.904Z",
        "2019-04-01T10:17:24.185Z",
        "2019-05-27T17:01:17.194Z",
        "2019-07-11T23:36:17.929Z",
        "2019-11-18T21:31:17.178Z",
        "2019-12-23T07:42:02.383Z",
        "2020-03-08T14:11:59.604Z",
        "2020-03-12T10:51:36.790Z",
    ],
    interestRate: 1.2, // %
    pin: 1111,
};

const account2 = {
    owner: "Jessica Davis",
    movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
    movementsDates: [
        "2019-01-25T14:18:46.235Z",
        "2019-02-05T16:33:06.386Z",
        "2019-03-10T14:43:26.374Z",
        "2019-04-25T18:49:59.371Z",
        "2019-11-01T13:15:33.035Z",
        "2019-11-30T09:48:16.867Z",
        "2019-12-25T06:04:23.907Z",
        "2020-02-26T12:01:20.894Z",
    ],
    interestRate: 1.5,
    pin: 2222,
};

const account3 = {
    owner: "Steven Thomas Williams",
    movements: [],
    movementsDates: [],
    interestRate: 0.7,
    pin: 3333,
};

const account4 = {
    owner: "Sarah Smith",
    movements: [],
    movementsDates: [],
    interestRate: 1,
    pin: 4444,
};

const accounts = [account1, account2, account3, account4];

//////////////////////////////////////////////////////
// ELEMENTS SELECTION

const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

//////////////////////////////////////////////////////
// VARIABLES
let currentUser,
    timeToLogout,
    globalLogoutTime,
    timer,
    timerInterval,
    sorted = false;

//////////////////////////////////////////////////////
// TO FORMAT THE DATE
const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
};

//////////////////////////////////////////////////////
// TO CHANGE THE VALUE IN ONE PLACE
timeToLogout = globalLogoutTime = 70;

//////////////////////////////////////////////////////
// CREATING A USERNAME FOR EACH ACCOUNT
accounts.forEach((account) => {
    account.user = account.owner
        .toLowerCase()
        .split(" ")
        .map((word) => word.slice(0, 1))
        .join("");
});

//////////////////////////////////////////////////////
// PROCESS THE LOGIN
btnLogin.addEventListener("click", function (event) {
    event.preventDefault();

    // Checking the credentials
    accounts.forEach((account) => {
        if (
            inputLoginUsername.value === account.user &&
            +inputLoginPin.value === account.pin
        ) {
            // Set the current user
            currentUser = account;
            // Reveal the app
            containerApp.style.opacity = 1;
            // Clear input fields
            inputLoginUsername.value = inputLoginPin.value = "";
            // Welcome message
            labelWelcome.textContent = `Welcome back, ${currentUser.owner.slice(
                0,
                currentUser.owner.indexOf(" ")
            )}!`;

            // Get the current time to update the welcome message
            const rightNow = new Date();

            labelDate.textContent = new Intl.DateTimeFormat(
                navigator.language,
                options
            ).format(rightNow);

            // Clearing the generic transactions (if any)
            containerMovements.innerHTML = "";

            updateDisplay(currentUser);

            if (timer) {
                stopLogoutTimer();
            }

            startLogoutTimer();
        }
    });
});

//////////////////////////////////////////////////////
// RENDERING THE UI
const updateDisplay = function (account) {
    calculateBalance(account);

    labelBalance.textContent = `${account.totalBalance}€`;
    labelSumOut.textContent = `${Math.abs(account.totalOutcome)}€`;
    labelSumIn.textContent = `${account.totalIncome}€`;
    labelSumInterest.textContent = `${account.totalInterest.toFixed(2)}€`;

    const sortedMovements = account.movements
        .map((transaction) => transaction)
        .sort((a, b) => a - b);

    const markup = !sorted
        ? calculateMovements(account.movements)
        : calculateMovements(sortedMovements);

    containerMovements.innerHTML = "";
    containerMovements.insertAdjacentHTML("afterbegin", markup);
};

//////////////////////////////////////////////////////
// PROCESS THE BALANCE AND TRANSACTIONS
const calculateBalance = function (account) {
    account.totalIncome = account.movements
        .filter((transaction) => transaction > 0)
        .reduce((acc, cur) => acc + cur, 0);

    account.totalOutcome = account.movements
        .filter((transaction) => transaction < 0)
        .reduce((acc, cur) => acc + cur, 0);

    account.totalInterest = account.movements
        .filter((transaction) => transaction > 0)
        .map((transaction) => (transaction * account.interestRate) / 100)
        .reduce((acc, cur) => acc + cur, 0);

    account.totalBalance = account.movements.reduce((acc, cur) => acc + cur, 0);
};

const calculateMovements = function (movements) {
    return movements
        .map((transaction, i) => {
            const type = transaction > 0 ? `deposit` : `withdrawal`;

            // Calculating how long time ago was the transaction made (in order to process the message)
            const transactionAge = calculateTransactionAge(
                new Date(currentUser.movementsDates[i])
            );

            const dateToDisplay;

            // Decide what message to be shown in the transaction Summary
            if (transactionAge <= 1) {
                dateToDisplay = `Today`;
            } else if (transactionAge > 1 && transactionAge <= 2) {
                dateToDisplay = `Yesterday`;
            } else {
                dateToDisplay = new Intl.DateTimeFormat(
                    navigator.language,
                    options
                ).format(new Date(currentUser.movementsDates[i]));
            }

            return `
        <div class="movements__row">
            <div class="movements__type movements__type--${type}">${
                i + 1
            } ${type}</div>
            <div class="movements__date">${dateToDisplay}</div>
            <div class="movements__value">${transaction}€</div>
        </div>`;
        })
        .join("");
};

const calculateTransactionAge = function (transactionDate) {
    return Math.abs(
        (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
};

//////////////////////////////////////////////////////
// FORMATTING THE TRANSACTION DATES (FOR NEWLY CREATED ONES)
const calcCurrentTransactionDate = function (now) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    return `${year}-${String(month).padStart(2, 0)}-${String(day).padStart(
        2,
        0
    )}T${String(hour).padStart(2, 0)}:${String(minutes).padStart(
        2,
        0
    )}:${String(seconds).padStart(2, 0)}.${String(milliseconds).padStart(
        3,
        0
    )}Z`;
};

/////////////////////////////////////////////////////////////////////////
// TRANSFER MONEY, REQUEST LOAN, CLOSE ACCOUNT AND LOGOUT FUNCTIONS
const transferMoney = function () {
    if (
        currentUser.owner !== inputTransferTo.value &&
        +currentUser?.totalBalance >= inputTransferAmount.value &&
        inputTransferAmount.value > 0
    ) {
        const amountToTransfer = inputTransferAmount.value;
        const recipient = accounts.find(
            (account) => account.user === inputTransferTo.value
        );

        if (!recipient) {
            alert(`Please check the recipient's login details`);
            return;
        }

        const currentTransactionDate = calcCurrentTransactionDate(new Date());

        currentUser.movements.push(-amountToTransfer);
        currentUser.movementsDates.push(currentTransactionDate);
        recipient.movements.push(+amountToTransfer);
        recipient.movementsDates.push(currentTransactionDate);

        updateDisplay(currentUser);

        if (timer) {
            stopLogoutTimer();
        }

        startLogoutTimer();
    } else {
        alert(`The amount must be positive and within your current balance`);
    }

    inputTransferTo.value = inputTransferAmount.value = "";
};

const requestLoan = function () {
    if (
        +inputLoanAmount.value <= currentUser.totalBalance * 0.1 &&
        +inputLoanAmount.value > 0
    ) {
        const currentTransactionDate = calcCurrentTransactionDate(new Date());

        currentUser.movements.push(+inputLoanAmount.value);
        currentUser.movementsDates.push(currentTransactionDate);
        updateDisplay(currentUser);

        if (timer) {
            stopLogoutTimer();
        }

        startLogoutTimer();
    }

    inputLoanAmount.value = "";
};

const closeAccount = function () {
    if (
        inputCloseUsername.value === currentUser.user &&
        +inputClosePin.value === currentUser.pin
    ) {
        accounts.splice(accounts.indexOf(currentUser), 1);
        logOut();
    }
    inputCloseUsername.value = inputClosePin.value = "";
};

const logOut = function () {
    stopLogoutTimer();
    containerApp.style.opacity = 0;
    currentUser = null;
    labelWelcome.textContent = `Log in to get started`;
};

//////////////////////////////////////////////////////
// HANDLING THE LOGOUT TIMER
const startLogoutTimer = function () {
    const logoutInterval = function () {
        let minutes, seconds;
        --timeToLogout;
        minutes = timeToLogout / 60;
        seconds = timeToLogout % 60;
        labelTimer.textContent = `${String(Math.trunc(minutes)).padStart(
            2,
            0
        )}:${String(seconds).padStart(2, 0)}`;
    };
    logoutInterval();

    timerInterval = setInterval(function () {
        logoutInterval();
    }, 1000);

    timer = setTimeout(function () {
        stopLogoutTimer();
        logOut();
    }, timeToLogout * 1000);
};

const stopLogoutTimer = function () {
    clearTimeout(timer);
    clearInterval(timerInterval);
    timeToLogout = globalLogoutTime;
};

//////////////////////////////////////////////////////
// BUTTONS EVENT LISTENERS
btnTransfer.addEventListener("click", function (event) {
    event.preventDefault();
    transferMoney();
});

btnLoan.addEventListener("click", function (event) {
    event.preventDefault();
    requestLoan();
});

btnClose.addEventListener("click", function (event) {
    event.preventDefault();
    closeAccount();
});

btnSort.addEventListener("click", function () {
    sorted = !sorted;
    updateDisplay(currentUser);
});

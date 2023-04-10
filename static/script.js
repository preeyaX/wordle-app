const WORD_LENGTH = 5;
let LIST_OF_GUESSES = [];

function init() {
    const allLetterInputs = document.querySelectorAll(".letter-guess"); // gets all 30 letter inputs
    for (let i = 0; i < allLetterInputs.length; i++) {
        allLetterInputs[i].addEventListener("keydown", function(event) {
            handleClick(allLetterInputs, i, event);
        })
    }
}
init();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleClick(elements, elementNumber, event) {
    if (event.key === "Backspace") {
        backspaceKeyPressed(elements, elementNumber, event);
    }
    else if (event.key === "Enter") {
        enterKeyPressed(elements, elementNumber);
    }
    else if (isLetter(event.key)) {
        letterKeyPressed(elements, elementNumber, event);
    }
    else {
        event.preventDefault();
    }
}

function backspaceKeyPressed(elements, elementNumber, event) {
    elements[elementNumber].value = "";
    if (!elements[elementNumber].matches(".letter-one")) {
        refocus(elements[elementNumber], elements[elementNumber - 1]);
    }
    event.preventDefault();
}

function enterKeyPressed(elements, elementNumber) {
    if (elements[elementNumber].matches(".letter-five") && elements[elementNumber].value !== "") {
        wordGuessed = "";
        for (let j = (elementNumber + 1) - WORD_LENGTH; j < (elementNumber + 1); j++) {
            wordGuessed += elements[j].value;
        }
        wordGuessed = wordGuessed.toLowerCase(); // removing case sensitivity
        handleGuess(wordGuessed, elements, elementNumber)
    }
}

function letterKeyPressed(elements, elementNumber, event) {
    if (elements[elementNumber].value !== "") {
        if (!elements[elementNumber].matches(".letter-five")) {
            refocus(elements[elementNumber], elements[elementNumber + 1]);
            elements[elementNumber + 1].value = event.key;
        } else {
            elements[elementNumber].value = event.key;
        }
    } else {
        elements[elementNumber].value = event.key;
        if (!elements[elementNumber].matches(".letter-five")) {
            refocus(elements[elementNumber], elements[elementNumber + 1]);
        }
    }
    event.preventDefault();
}

function isLetter(letter) { return /^[a-zA-Z]$/.test(letter) }

function refocus(elementToBlur, elementToFocus) {
    // elements are by default made to focus when blurred using HTML onblur.
    elementToBlur.onblur = function() { this.blur() } // to automatically change focus between input fields, the selected element must first be allowed to blur
    elementToFocus.focus(); // then the new input field is brought to focus
    elementToFocus.onblur = function() { this.focus() } // and when an input field is in focus, it cannot be blurred by manual click
}

async function validateGuess(wordGuessed) {
    setLoading(true);
    try {
        const promise = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST",
            body: JSON.stringify( {"word": wordGuessed} )
        });
        const response = await promise.json();
        const isValid = response.validWord;
        setLoading(false);
        return isValid;
    } catch (err) {
        console.log("An error has occured while validating guess: " + err);
    }
}

async function getWordOfDay() {
    try {
        const promise = await fetch("https://words.dev-apis.com/word-of-the-day");
        const response = await promise.json();
        const wordOfDay = response.word; // a string
        return wordOfDay;
    } catch (err) {
        console.log("An error has occured while getting the word of the day: " + err);
    }
}

async function handleGuess(wordGuessed, elements, elementNumber) {
    const wordOfDay = await getWordOfDay(); // first get the word of the day
    const isValid = await validateGuess(wordGuessed); // only then validate the guess

    if (isValid) {
        const colorsList = handleLetterColors(wordGuessed, wordOfDay);
        paintBlocks(colorsList, elements, elementNumber);
        postWordToDb(wordGuessed, elementNumber);

        if (wordGuessed === wordOfDay) { // correct guess
            document.querySelector(".end-of-program").style.color = "#00ff00";
            document.querySelector(".end-heading").innerText = "YOU WIN!";
            document.querySelector(".end-words").innerText = "You guessed the correct word.";
        } else { // wrong guess
            if (elementNumber < elements.length - 1) {
                refocus(elements[elementNumber], elements[elementNumber + 1])
            } else {
                document.querySelector(".end-of-program").style.color = "red";
                document.querySelector(".end-heading").innerText = "YOU LOST.";
                document.querySelector(".end-words").innerText = "The correct word was '" + wordOfDay.toUpperCase() + "'";
                console.log("All guesses as from Db: " + LIST_OF_GUESSES);
            }
        }
    } else { // if the guess is not a word
        invalidInputBorderBlink(elements, elementNumber);
    }
}

async function postWordToDb(wordGuessed, elementNumber) {
    try {
        const promise = await fetch('/post', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                'word': wordGuessed,
                'guessNumber': (elementNumber + 1)/5
            })
        });
        const res = await promise.json();
        LIST_OF_GUESSES.push(res.word);
    } catch (err) {
        console.log("Unable to post word to Db: " + err);
    }
}

function invalidInputBorderBlink(elements, elementNumber) {
    for (let i = (elementNumber + 1) - WORD_LENGTH; i < (elementNumber + 1); i++) {
        elements[i].classList.remove("border-blink");

        setTimeout(function() {
            elements[i].classList.add("border-blink");
        }, 10);
    }
}

function handleLetterColors(wordGuessed, wordOfDay) {
    let listOfColors = [];
    let tempWordOfDay = wordOfDay;

    for (let c = 0; c < WORD_LENGTH; c++) {
        let colorOfLetterBlock;
        if (tempWordOfDay.includes(wordGuessed.charAt(c))) {
            if (wordOfDay.charAt(c) === wordGuessed.charAt(c)) {
                colorOfLetterBlock = "green";
            } else {
                colorOfLetterBlock = "goldenrod";
            }
            tempWordOfDay = tempWordOfDay.replace(wordGuessed.charAt(c), ""); // takes care of repeated letters
        } else {
            colorOfLetterBlock = "gray";
        }
        listOfColors.push(colorOfLetterBlock);
    }
    return listOfColors;
}

function paintBlocks(listOfColors, elements, elementNumber) {
    let colorCounter = 0;
    for (let i = (elementNumber + 1) - WORD_LENGTH; i < (elementNumber + 1); i++) {
        elements[i].style.backgroundColor = listOfColors[colorCounter];
        elements[i].style.borderColor = listOfColors[colorCounter]
        colorCounter++;
    }
}

function setLoading(isLoading) {
    document.querySelector(".load-bar").classList.toggle("hide", !isLoading);
}
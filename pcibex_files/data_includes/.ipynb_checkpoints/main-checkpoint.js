PennController.ResetPrefix(null); // Shorten command names (keep this line here))

DebugOff()   // Debugger is closed

const voucher = b64_md5((Date.now() + Math.random()).toString()) // Voucher code generator

Header(
    // Declare global variables to store the participant's ID and demographic information
    newVar("AGE").global(),
    newVar("GENDER").global(),
    newVar("LINGUIST").global()
)
 // Add the particimant info to all trials' results lines
.log( "age"    , getVar("AGE") )
.log( "gender" , getVar("GENDER") )
.log( "linguist" , getVar("LINGUIST") )
.log( "code"   , voucher )

// Sequence of events: consent to ethics statement required to start the experiment, participant information, instructions, exercise, transition screen, main experiment, result logging, and end screen.
Sequence("ethics", "setcounter", "participants", "instructions", randomize("exercise"), "start_experiment", rshuffle("experiment-filler", "experiment-item"), SendResults(), "end")

// Ethics agreement: participants must agree before continuing
newTrial("ethics",
    newHtml("ethics_explanation", "ethics.html")
        .cssContainer({"margin":"1em"})
        .print()
    ,
    newHtml("form", `<div class='fancy'><input name='consent' id='consent' type='checkbox'><label for='consent'>Я подтверждаю, что мне есть 18 лет.</label></div>`)
        .cssContainer({"margin":"1em"})
        .print()
    ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("go_to_info").enable()._runPromises();
        else getButton("go_to_info").disable()._runPromises();
    }) ).call()
    ,
    newButton("go_to_info", "Начать эксперимент")
        .cssContainer({"margin":"1em"})
        .disable()
        .print()
        .wait()
)

// Start the next list as soon as the participant agrees to the ethics statement
// This is different from PCIbex's normal behavior, which is to move to the next list once 
// the experiment is completed. In my experiment, multiple participants are likely to start 
// the experiment at the same time, leading to a disproportionate assignment of participants
// to lists.
SetCounter("setcounter")

// Participant information: questions appear as soon as information is input
newTrial("participants",
    defaultText
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newText("participant_info_header", "<div class='fancy'><h2>Сначала, пожалуйста, ответьте на несколько вопросов.</h2></div>")
    ,
    // Age
    newText("<b>Сколько Вам лет?</b><br>(нажмите Enter, чтобы перейти к следующему вопросу)")
    ,
    newTextInput("input_age")
        .length(2)
        .log()
        .print()
        .wait()
    ,
    // Gender
    newText("<b>Укажите Ваш пол</b>")
    ,
    newScale("input_gender",   "женский", "мужской", "другое")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    // Linguistics education
    newText("<b>Есть ли у Вас лингвистическое образование (в т.ч. неоконченное)?</b>")
    ,
    newScale("input_linguist",   "Да", "Нет")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    // Clear error messages if the participant changes the input
    // newKey("just for callback", "") 
    //     .callback( getText("errorage").remove() , getText("errorID").remove() )
    // ,
    // Formatting text for error messages
    defaultText.color("Crimson").print()
    ,
    // Continue. Only validate a click when ID and age information is input properly
    newButton("weiter", "Перейти к инструкции")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
        // Check for participant ID and age input
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
            // Age
                .and( getTextInput("input_age").test.text(/^\d+$/)
                .failure( newText('errorage', "Bitte tragen Sie Ihr Alter ein."), 
                          getTextInput("input_age").text("")))  
        )
    ,
    // Store the texts from inputs into the Var elements
    getVar("AGE")    .set( getTextInput("input_age") ),
    getVar("GENDER") .set( getScale("input_gender") ),
    getVar("LINGUIST")   .set( getScale("input_linguist") )
)

// Instructions
newTrial("instructions",
    newText("instructions_greeting", "<h2>Начнём!</h2><p>В этом эксперименте Вам нужно будет оценивать предложения русского языка. Для каждого предложения Вам нужно будет решить, насколько оно приемлемо звучит по шкале от 1 до 7. Ставьте 1, если предложение звучит плохо и Вы не думаете, что когда-либо услышите такое или скажете так. Ставьте 7, если предложение звучит хорошо, без нареканий. Если Ваша оценка где-то посередине, используйте промежуточные числа на шкале (2-6). Полагайтесь на свою интуицию как носителя языка.</p><p>Шкала выглядит так:</p>")
        .left()
        .cssContainer({"margin":"1em"})
        .print()
        ,
    // 7-point scale
    newScale(7)
        .before( newText("left", "<div class='fancy'>(<em>плохо</em>)</div>") )
        .after( newText("right", "<div class='fancy'>(<em>хорошо</em>)</div>") )
        .keys()
        .labelsPosition("top")
        .color("LightCoral")
        .cssContainer({"margin":"1em"})
        .left()
        .print()
        ,
    newHtml("instructions_text", "instructions.html")
        .cssContainer({"margin":"1em"})
        .print()
        ,
        newButton("go_to_exercise", "Перейти к тренировке")
        .cssContainer({"margin":"1em"})
        .print()
        .wait()
)

// Exercise
Template("exercise.csv", row =>
    newTrial( "exercise" ,
        newText("sentence", row.SENTENCE)
            .cssContainer({"margin-top":"2em", "margin-bottom":"2em"})
            .center()
            .print()
            ,
        newScale(7)
            .before( newText("left", "<div class='fancy'>(<em>плохо</em>)</div>") )
            .after( newText("right", "<div class='fancy'>(<em>хорошо</em>)</div>") )
            .keys()
            .log()
            .once()
            .labelsPosition("top")
            .color("LightCoral")
            .center()
            .print()
            .wait()
        ,
        // Wait briefly to display which option was selected
        newTimer("wait", 300)
            .start()
            .wait()
    )
)

// Start experiment
newTrial( "start_experiment" ,
    newText("<h2>Сейчас начнётся основная часть эксперимента.</h2>")
        .print()
    ,
    newButton("go_to_experiment", "Начать")
        .print()
        .wait()
)

// Experimental trial
Template("experiment.csv", row =>
    newTrial( "experiment-"+row.TYPE,
        newText("sentence", row.SENTENCE)
            .cssContainer({"margin-top":"2em", "margin-bottom":"2em"})
            .center()
            .print()
            ,
    // 7-point scale
        newScale(7)
            .before( newText("left", "<div class='fancy'>(<em>плохо</em>)</div>") )
            .after( newText("right", "<div class='fancy'>(<em>хорошо</em>)</div>") )
            .labelsPosition("top")
            .keys()
            .log()
            .once()
            .color("LightCoral")
            .center()
            .print()
            .wait()
        ,
        // Wait briefly to display which option was selected
        newTimer("wait", 300)
            .start()
            .wait()
    )
    // Record trial data
    .log("ITEM"     , row.ITEM)
    .log("CONDITION", row.CONDITION)
    .log("TENSE"   , row.CASE)
    .log("TYPE"   , row.TYPE)
    .log("FILLER_TYPE"   , row.FILLER_TYPE)
)

// Final screen: explanation of the goal
newTrial("end",
    newText("<div class='fancy'><h2>Спасибо за участие в эксперименте!</h2></div><p>По любым вопросам пишите на адрес notalexandrashikunova@gmail.com или в <a href=\"t.me/thnlgrlivrlvdwsbrnwthrssnhrys\">телеграм</a>.</p></div>")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newHtml("explain", "end.html")
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);
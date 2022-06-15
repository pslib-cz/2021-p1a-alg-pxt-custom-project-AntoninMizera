const innerRing = neopixel.create(PIN_RING_INNER, 24, NeoPixelMode.RGB);
const outerRing = neopixel.create(PIN_RING_OUTER, 60, NeoPixelMode.RGB);

let clockMode = true;
let running = false;
let rdy = false;

let stopwatchStart = 0;
let stopwatchModeLastSegmentAmount = 0;
let stopwatchPause = false;
let stopwatchPauseInit = 0;

//let clockSpeed = 6.125;
let clockSpeed = 360 / 60;
let clockInit = 0;
let lastSecs = 0;

let settingsMode = false;
let changingMinutes = false;
let blink = true;

let settingsModeButtonInit = 0;
let newHours = 0;
let newMins = 0;

innerRing.setBrightness(127);
outerRing.setBrightness(127);


console.log(`${DS3231.dateString()} ${DS3231.timeString()}`);

if (ENABLE_SQW) {
    // A little bit of cheating - this will enable a 1Hz pulse generator on DS3231
    DS3231.setStatus(DS3231.status()
        & 0b11110111 // This should disable the 32KHz clock pin
    );

    DS3231.setControl(DS3231.control()
        & 0b11100011 // This sets RS2, RS1, and INTCN control bits to 0, enabling the pulse generator
    );

    if ((DS3231.status() & 0b10000000) === 0b10000000) {
        console.log("the oscillator is disabled :(");
    } else {
        console.log("the oscillator is enabled :)");

        if ((DS3231.control() & 0b00011000) === 0) {
            console.log("SQW should be 1Hz");
        }
    }
} else {
    console.log("SQW is not enabled");
}

// Reset clock hand position
console.log("Initial clock reset...");
clock.reset();
rdy = true;


basic.forever(() => {
    const t1 = control.millis();
    innerRing.clear();
    outerRing.clear();

    const mins = DS3231.minutes();
    const hours = DS3231.hours();
    const secs = DS3231.seconds();

    if (settingsMode) {
        if (changingMinutes) {
            neopixel.setRangeColor(innerRing, newHours + 1, COLOR_HOURS);
            if (blink) neopixel.setRangeColor(outerRing, newMins + 1, COLOR_MINUTES);
        } else {
            neopixel.setRangeColor(outerRing, newMins + 1, COLOR_MINUTES);
            if (blink) neopixel.setRangeColor(innerRing, newHours + 1, COLOR_HOURS);
        }

        blink = !blink;
    } else {
        if (clockMode) {
            console.log(DS3231.timeString());

            const numMinLeds = (hours < 12 ? hours : hours - 12) * 2 + (mins > 30 ? 1 : 0);

            neopixel.setRangeColor(innerRing, numMinLeds + 1, COLOR_HOURS);
            neopixel.setRangeColor(outerRing, Math.min(mins, 60) + 1, COLOR_MINUTES);

            if (!ENABLE_SQW && !running) {
                if (secs === 0) {
                    running = true;
                    clockInit = control.millis();
                }
                lastSecs = secs;

                const t2 = control.millis();
                basic.pause(1000 - (t2 - t1));
                return;
            }

            if (running) {
                const now = control.millis();
                const delta = now - clockInit;

                if (!pins.digitalReadPin(PIN_IR_SENSOR) && delta > 5000) {
                    if (secs !== 0) {
                        running = false;
                    }

                    console.log(`It took ${delta} ms for a whole turn (speed: ${clockSpeed})`);
                    console.log(`Will be running next cycle? ${running}`);

                    const clockRatio = (now - clockInit) / 60000;
                    clockInit = now;
                    if (clockRatio < 0.975 || clockRatio > 1.025) {

                        clockSpeed *= clockRatio;
                        console.log(`New clock movement speed: ${clockSpeed}`);

                        if (secs !== 0) {
                            clock.fixUpClockHead();
                            running = false;
                            return;
                        }
                    }


                }

                const secondDelta = clock.calculateClockGap(lastSecs, secs);
                console.log(secondDelta);

                if (!ENABLE_SQW)
                    PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, secondDelta * clockSpeed);
            }
        } else {
            if (!stopwatchStart) {
                stopwatchStart = control.millis();
            }
            if (!running) {
                console.log("Not running, pausing for 10 seconds and switching back to clock mode...");

                // Disable LEDs
                innerRing.show();
                outerRing.show();

                basic.pause(10000);
                switchMode();
                return;
            }

            const currentMs = stopwatchPause ? stopwatchPauseInit : control.millis();
            const msLeds = Math.floor((
                ((currentMs - stopwatchStart) % 1000) / 1000) // converts milliseconds into fractional seconds (effectively turning into a percentage)
                * 60                                          // which are multiplied by 60 to get the result
            );

            const segments = (currentMs - stopwatchStart) % 12000;
            const secondLeds = Math.floor(segments / 500);

            neopixel.setRangeColor(outerRing, msLeds + 1, COLOR_MINUTES);
            neopixel.setRangeColor(innerRing, secondLeds + 1, COLOR_HOURS);

            const lastSegmentAmount = Math.floor((currentMs - stopwatchStart) / 12000);
            if (lastSegmentAmount > stopwatchModeLastSegmentAmount) {
                console.log(`${lastSegmentAmount} ${stopwatchModeLastSegmentAmount}`);
                control.inBackground(() => PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, (360 / 60) * 5));
            }

            stopwatchModeLastSegmentAmount = lastSegmentAmount;

            if (stopwatchModeLastSegmentAmount > 2) {
                running = !!pins.digitalReadPin(PIN_IR_SENSOR);

                // console.log("running: " + running);
            }
        }
    }



    innerRing.show();
    outerRing.show();

    if (clockMode) {
        lastSecs = secs;
    }

    if (clockMode || settingsMode) {
        const t2 = control.millis();
        if (!settingsMode)
            basic.pause(1000 - (t2 - t1));
        else
            basic.pause(500 - (t2 - t1));
    }

});


input.onButtonPressed(Button.A, () => {
    clock.fixUpClockHead();
});

input.onButtonPressed(Button.B, () => {

});

input.onButtonPressed(Button.AB, () => {
    PCAmotor.MotorStopAll();
});

pins.onPulsed(PIN_BUTTON_FIRST, PulseValue.Low, () => {
    if (!settingsMode) {
        switchMode();
        console.log(`New clock mode: ${clockMode ? "clock" : "stopwatch"}`);
    } else {
        if (changingMinutes) {
            newMins = Math.constrain(newMins + 1, 0, 59);
        } else {
            newHours = Math.constrain(newHours + 1, 0, 23);
        }

        blink = true;

        console.log(`${newHours}:${newMins}`);
    }
});

pins.onPulsed(PIN_BUTTON_SECOND, PulseValue.Low, () => {
    if (settingsMode) {
        if (changingMinutes) {
            newMins = Math.constrain(newMins - 1, 0, 59);
        } else {
            newHours = Math.constrain(newHours - 1, 0, 23);
        }

        blink = true;

        console.log(`${newHours}:${newMins}`);
    }
});

pins.onPulsed(PIN_BUTTON_THIRD, PulseValue.Low, () => {
    settingsModeButtonInit = control.millis();
});

pins.onPulsed(PIN_BUTTON_THIRD, PulseValue.High, () => {
    if (settingsModeButtonInit === 0) return;

    const delta = control.millis() - settingsModeButtonInit;

    console.log(`Button pulse delta: ${delta}`);

    if (delta < 1000) {
        if (settingsMode) {
            changingMinutes = !changingMinutes;
            blink = true;
        } else if (!clockMode) {
            stopwatchPause = !stopwatchPause;

            if (stopwatchPause) {
                stopwatchPauseInit = control.millis();
            } else {
                const diff = control.millis() - stopwatchPauseInit;

                stopwatchStart += diff;
            }
        }
    } else if (delta > 1000) {
        settingsMode = !settingsMode;
        console.log(`Switching ${settingsMode ? "to" : "from"} setting mode`);

        if (settingsMode) {
            newHours = DS3231.hours();
            newMins = DS3231.minutes();
        } else {
            // Write new settings back
            DS3231.setTime(newHours, newMins, 0);
        }

        running = false;
        clock.reset();
    }

    settingsModeButtonInit = 0;
});

if (ENABLE_SQW) {
    pins.onPulsed(PIN_SQW, PulseValue.Low, () => {
        console.log("tick");
        if (!running && DS3231.seconds() === 0) {
            console.log("Enabling the motor!");
            running = true;
            clockInit = control.millis();
            lastSecs = 0;
        }
        if (running) {
            PCAmotor.StepperDegree(PCAmotor.Steppers.STPM2, clockSpeed);
        }
    });
}

function switchMode() {
    clock.reset();
    clockMode = !clockMode;
    stopwatchStart = null;

    if (!clockMode) running = true;
}

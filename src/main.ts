const innerRing = neopixel.create(PIN_RING_INNER, 24, NeoPixelMode.RGB);
const outerRing = neopixel.create(PIN_RING_OUTER, 60, NeoPixelMode.RGB);

let clockMode = true;
let stopwatchStart = 0;

let running = false;
let rdy = false;

let stopwatchModeLastSegmentAmount = 0;

let clockSpeed = 6.125;
let clockInit = 0;
let lastSecs = 0;

innerRing.setBrightness(127);
outerRing.setBrightness(127);


console.log(`${DS3231.dateString()} ${DS3231.timeString()}`);

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

    if (clockMode) {
        console.log(DS3231.timeString());

        const numMinLeds = (hours < 12 ? hours : hours - 12) * 2 + (mins > 30 ? 1 : 0);
        
        neopixel.setRangeColor(innerRing, numMinLeds + 1, COLOR_HOURS);
        neopixel.setRangeColor(outerRing, Math.min(mins, 60) + 1, COLOR_MINUTES);

        if (!running) {
            running = secs === 0;
            clockInit = control.millis();
            lastSecs = secs;
            
            const t2 = control.millis();
            basic.pause(1000 - (t2 - t1));
            return;
        }

        if (running) {
            const now = control.millis();
            const delta = now - clockInit;

            if (!pins.digitalReadPin(PIN_IR_SENSOR) && delta > 5000) {
                running = secs !== 0; // if reached 0 secs, yay, we can game!

                console.log(`It took ${delta} ms for a whole turn`);
                
                const clockRatio = (now - clockInit) / 60000;
                clockInit = now;
                if (clockRatio < 0.95 || clockRatio > 1.05) {
                    
                    clockSpeed *= clockRatio;
                    console.log(`New clock movement speed: ${clockSpeed}`);
                    
                    if (secs !== 0) {
                        clock.fixUpClockHead();
                        running = false;
                        return;
                    }
                }

                
            }

            PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, clockSpeed);
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

        const currentMs = control.millis();
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

    innerRing.show();
    outerRing.show();

    if (clockMode) {
        lastSecs = secs;
        const t2 = control.millis();
        basic.pause(1000 - (t2 - t1));
    }
    
})


input.onButtonPressed(Button.A, () => {
    clock.fixUpClockHead();
});

input.onButtonPressed(Button.B, () => {

});

input.onButtonPressed(Button.AB, () => {
    PCAmotor.MotorStopAll();
});

pins.onPulsed(PIN_BUTTON_FIRST, PulseValue.Low, () => {
    switchMode();
    console.log(`New clock mode: ${clockMode ? "clock" : "stopwatch"}`);
});


function switchMode() {
    clock.reset();
    clockMode = !clockMode;
    stopwatchStart = null;

    if (!clockMode) running = true;
}

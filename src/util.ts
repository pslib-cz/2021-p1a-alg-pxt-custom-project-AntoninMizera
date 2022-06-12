const ANGLE_PER_SECOND = 360 / 60;

namespace clock {
    pins.setPull(PIN_IR_SENSOR, PinPullMode.PullNone);
    export function reset() {
        if (!pins.digitalReadPin(PIN_IR_SENSOR)) {
            console.log("IR is on, not resetting clock");
            fixUpClockHead();
            return;
        }

        PCAmotor.StepperEnable(PIN_STEPPER_MOTOR, true);

        while (pins.digitalReadPin(PIN_IR_SENSOR)) basic.pause(100);
        PCAmotor.MotorStopAll();

        //PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, 12);
        fixUpClockHead();
    }

    export function fixUpClockHead() {

        let stepsBackward = 0, stepsForward = 0,
            wentThroughSensor = !pins.digitalReadPin(PIN_IR_SENSOR); 

        while (true) {
            PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, -2);
            stepsBackward++;

            basic.pause(50);

            const pinVal = pins.digitalReadPin(PIN_IR_SENSOR);
            
            if (!pinVal) {
                console.log("went through sensor");
                wentThroughSensor = true;
            }
            if (wentThroughSensor && pinVal) {
                
                console.log("Already gone through sensor");
                break;
            }
        }

        wentThroughSensor = false;

        while (true) {
            PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, 2);
            stepsForward++;
            basic.pause(50);

            const pinVal = pins.digitalReadPin(PIN_IR_SENSOR);

            if (!pinVal) {
                console.log("went through sensor");
                wentThroughSensor = true;
            }
            if (wentThroughSensor && pinVal) {
                console.log("Already gone through sensor");
                break;
            }
        }

        console.log(`backward steps: ${stepsBackward}, forward steps: ${stepsForward}`);

        for (let i = 0; i < Math.floor((stepsBackward + stepsForward) / 2); i++) {
            PCAmotor.StepperDegree(PIN_STEPPER_MOTOR, -2);
        }
        
        basic.pause(50);
        if (pins.digitalReadPin(PIN_IR_SENSOR)) fixUpClockHead();
    }

    /**
     * Compares two second values and returns the time delta
     */
    export function calculateClockGap(before: number, after: number): number {
        if (before > after) {
            return after - before + 60;
        } else {
            return after - before;
        }
    }
}


namespace neopixel {
    export function setRangeColor(strip: Strip, amount: number, color: number) {
        for (let i = 0; i < amount; i++) {
            strip.setPixelColor(i, color);
        }
    }
}
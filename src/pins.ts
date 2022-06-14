/**
 * The pin for the IR sensor
 */
const PIN_IR_SENSOR = DigitalPin.P8;

/**
 * Pins for capacitive touch buttons
 */
const PIN_BUTTON_FIRST = DigitalPin.P2;
const PIN_BUTTON_SECOND = DigitalPin.P12;
const PIN_BUTTON_THIRD = DigitalPin.P13;

/**
 * Pins for the LED rings
 */
const PIN_RING_INNER = DigitalPin.P14;
const PIN_RING_OUTER = DigitalPin.P15;

/**
 * The pin for the stepper motor
 */
const PIN_STEPPER_MOTOR = PCAmotor.Steppers.STPM2;

/**
 * Whether to enable the square wave generator or not
 * Recommended to enable as it helps the micro:bit
 * to decide when to enable and rotate the motor.
 */
const ENABLE_SQW = true;

/**
 * The SQW pin of DS3231's square wave generator
 */
const PIN_SQW = DigitalPin.P1;

/**
 * Sets the color for the rings - COLOR_HOURS is used in the inner ring,
 * COLOR_MINUTES is used in the outer ring
 */
const COLOR_HOURS = 0x008800;
const COLOR_MINUTES = 0x880000;
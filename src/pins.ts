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
 * Sets the color for the rings - COLOR_HOURS is used in the inner ring,
 * COLOR_MINUTES is used in the outer ring
 */
const COLOR_HOURS = 0x008800;
const COLOR_MINUTES = 0x880000;
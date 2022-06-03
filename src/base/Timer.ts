// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Timers will fire a function taking no arguments, and returning no results.
export type TimerFn = () => void;

// The Timer class is a wrapper around JavaScript's setTimeout functionality, while adding support
// for suspending and resuming the time based on an otherwise fixed time of firing.
export class Timer {
    #callback: TimerFn;

    #target?: number = undefined;
    #timeout?: NodeJS.Timeout = undefined;

    constructor(fn: TimerFn) {
        this.#callback = fn;
    }

    // Starts a timer that should fire in |ms| milliseconds.
    public start(ms: number) {
        if (this.#timeout)
            clearTimeout(this.#timeout);

        this.#target = performance.now() + ms;
        this.#timeout = setTimeout(Timer.prototype.onFire.bind(this), ms);
    }

    // Suspends the timer. It may be resumed at some later point in time.
    public suspend() {
        if (this.#timeout)
            clearTimeout(this.#timeout);

        this.#timeout = undefined;
    }

    // Resumes the timer. If the target time was in the past, it will fire immediately.
    public resume() {
        if (!this.#target) {
            console.error('Unable to resume the timer, it has not been started yet');
            return;
        }

        if (this.#timeout)
            clearTimeout(this.#timeout);

        const currentTime = performance.now();
        if (this.#target <= currentTime) {
            this.onFire();
            return;
        }

        this.#timeout = setTimeout(Timer.prototype.onFire.bind(this), currentTime - this.#target);
    }

    // Safe version of resume() that automatically restarts a timer when it cannot be resumed.
    public resumeOrRestart(ms: number) {
        if (this.#target)
            this.resume();
        else
            this.start(ms);
    }

    // Stops the timer altogether.
    public stop() {
        if (this.#timeout)
            clearTimeout(this.#timeout);

        this.#target = undefined;
        this.#timeout = undefined;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the timer has fired. Clears internal state, then calls the configured callback.
    private onFire() {
        this.#target = undefined;
        this.#timeout = undefined;

        this.#callback();
    }
}

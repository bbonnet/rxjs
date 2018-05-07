import { Operator } from '../Operator';
import { Subscriber } from '../Subscriber';
import { Observable } from '../Observable';
import { OperatorFunction } from '../types';
import {isNumber} from 'util';

/**
 *
 * Calculates the running average for the values emitted by the source.
 *
 * Applies a given `project` function to each value emitted by the source
 * Observable, and emits the resulting values as an Observable.
 *
 *
 * <img src="./img/average.png" width="100%">
 *
 *
 * @example <caption>Map every click to the clientX position of that click</caption>
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var positions = clicks.map(ev => ev.clientX);
 * positions.subscribe(x => console.log(x));
 *
 * @param {function(value: T, index: number): number} project The function to apply
 * to each `value` emitted by the source Observable. The `index` parameter is
 * the number `i` for the i-th emission that has happened since the
 * subscription, starting from the number `0`.
 * @param {function(value: T, index: number): number} projectWeight The function to apply
 * to each `value` emitted by the source Observable. The `index` parameter is
 * the number `i` for the i-th emission that has happened since the
 * subscription, starting from the number `0`.
 * @param {any} [thisArg] An optional argument to define what `this` is in the
 * `project` function.
 * @return {Observable<number>} An Observable that emits the values from the source
 * Observable transformed by the given `project` function.
 * @method average
 * @owner Observable
 */
export function average<T>(project?: (value: T, index?: number) => number,
                           projectWeight?: (value: T, index?: number) => number,
                           thisArg?: any): OperatorFunction<T, number> {

  /**
   * Identify of a number or zero if the value is not a number
   *
   * @param {T} x
   * @param {number} index
   * @returns {number}
   */
  function identity(x: T, index?: number) {
    return isNumber(x) ? x : 0;
  }

  function one(x: T, index?: number) {
    return 1;
  }

  return function averageOperation(source: Observable<T>): Observable<number> {
    if (typeof project !== 'function' && typeof projectWeight !== 'function') {
      // Case where user doesn't provide a projection for value nor weight
      return source.lift(new AverageOperator(identity, one, thisArg));
    } else if (typeof projectWeight !== 'function') {
      // Case where user only provides a value projection
      return source.lift(new AverageOperator(project, one, thisArg));
    }

    return source.lift(new AverageOperator(project, projectWeight, thisArg));
  };
}

export class AverageOperator<T> implements Operator<T, number> {
  constructor(private project: (value: T, index: number) => number,
              private projectWeight: (value: T, index: number) => number,
              private thisArg: any) {
  }

  call(subscriber: Subscriber<number>, source: any): any {
    return source.subscribe(new AverageSubscriber(subscriber, this.project, this.projectWeight, this.thisArg));
  }
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class AverageSubscriber<T> extends Subscriber<T> {
  /**
   * Count of number of values added to this average
   *
   * @type {number}
   */
  count: number = 0;

  /**
   * Sum of values added to this average
   * @type {number}
   */
  value: number = 0;

  /**
   * Sum of the weights added to this average
   * @type {number}
   */
  private sumWeights = 0;

  private thisArg: any;

  /**
   * Indicate if this subscriber should emit events for running averages
   * or just the final average.
   *
   * @type {boolean}
   */
  private isRunning;

  constructor(destination: Subscriber<number>,
              private project: (value: T, index: number) => number,
              private projectWeight: (value: T, index: number) => number,
              thisArg: any) {
    super(destination);
    this.thisArg = thisArg || this;
    this.isRunning = true;
  }

  /**
   * Calculate the running weighted average
   *
   * Based on: http://people.ds.cam.ac.uk/fanf2/hermes/doc/antiforgery/stats.pdf
   *
   * @param {T} value
   * @private
   */
  protected _next(value: T) {
    try {
      // Project the value using the proper `this` context
      const v = this.project.call(this.thisArg, value, this.count);
      // Project the weight using the proper `this` context
      const w = this.projectWeight.call(this.thisArg, value, this.count);

      this.sumWeights += w;
      this.value = this.value + (w / this.sumWeights) * (v - this.value);
      this.count++;

      if (this.isRunning) {
        this.destination.next(this.value);
      }
    } catch (err) {
      this.destination.error(err);
      return;
    }
  }

  protected _complete(): void {
    if (!this.isRunning) {
      this.destination.next(this.value);
    }
    this.destination.complete();
  }
}

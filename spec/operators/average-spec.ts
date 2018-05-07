import { expect } from 'chai';
import * as Rx from 'rxjs/Rx';
import { hot, cold, expectObservable, expectSubscriptions } from '../helpers/marble-testing';

declare function asDiagram(arg: string): Function;

const Observable = Rx.Observable;

/** @test {average} */
describe('Observable.prototype.average', () => {
  asDiagram('average')('should average multiple values', () => {
    const a =   cold('--a--b--c--|', { a: 1, b: 2, c: 3 });
    const asubs =    '^          !';
    const expected = '--x--y--z--|';

    const r = a.average();

    expectObservable(r).toBe(expected, {x: 1, y: 1.5, z: 2});
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should average one value', () => {
    const a =   cold('--x--|', { x: 42 });
    const asubs =    '^    !';
    const expected = '--y--|';

    const r = a.average();

    expectObservable(r).toBe(expected, { y: 42 });
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should average multiple values', () => {
    const a =   cold('--a--b--c--|', { a: 1, b: 2, c: 3 });
    const asubs =    '^          !';
    const expected = '--x--y--z--|';

    const r = a.average();

    expectObservable(r).toBe(expected, { x: 1, y: 1.5, z: 2 });
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should propagate errors from average function', () => {
    const a =   cold('--x--|', { x: 42 });
    const asubs =    '^ !   ';
    const expected = '--#   ';

    const r = a.average((x: any) => {
      throw 'too bad';
    });

    expectObservable(r).toBe(expected, null, 'too bad');
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should propagate errors from observable that emits only errors', () => {
    const a =   cold('#');
    const asubs =    '(^!)';
    const expected = '#';

    const r = a.average();
    expectObservable(r).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should propagate errors from observable that emit values', () => {
    const a =   cold('--a--b--#', { a: 1, b: 2 }, 'too bad');
    const asubs =    '^       !';
    const expected = '--x--y--#';

    const r = a.average();
    expectObservable(r).toBe(expected, { x: 1, y: 1.5 }, 'too bad');
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should not average an empty observable', () => {
    const a =   cold('|');
    const asubs =    '(^!)';
    const expected = '|';

    let invoked = 0;
    const r = a
      .average((x: any) => { invoked++; return x; })
      .do(null, null, () => {
        expect(invoked).to.equal(0);
      });

    expectObservable(r).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  it('should allow unsubscribing explicitly and early', () => {
    const a =   cold('--a--b--c--|', { a: 1, b: 2, c: 3 });
    const unsub =    '      !     ';
    const asubs =    '^     !     ';
    const expected = '--x--y-     ';

    const r = a.average();

    expectObservable(r, unsub).toBe(expected, { x: 1, y: 1.5 });
    expectSubscriptions(a.subscriptions).toBe(asubs);
  });

  //
  // it('should average using a custom thisArg', () => {
  //   const a = hot('-5-^-4--3---2----1--|');
  //   const asubs =    '^                !';
  //   const expected = '--a--b---c----d--|';
  //   const values = {a: 5, b: 14, c: 23, d: 32};
  //
  //   const foo = {
  //     value: 42
  //   };
  //   const r = a
  //     .average(function (x: string, index: number) {
  //       expect(this).to.equal(foo);
  //       return (parseInt(x) + 1) + (index * 10);
  //     }, foo);
  //
  //   expectObservable(r).toBe(expected, values);
  //   expectSubscriptions(a.subscriptions).toBe(asubs);
  // });
  //
  // it('should average twice', () => {
  //   const a = hot('-0----1-^-2---3--4-5--6--7-8-|');
  //   const asubs =         '^                    !';
  //   const expected =      '--a---b--c-d--e--f-g-|';
  //   const values = {a: 2, b: 3, c: 4, d: 5, e: 6, f: 7, g: 8};
  //
  //   let invoked1 = 0;
  //   let invoked2 = 0;
  //   const r = a
  //     .average((x: string) => { invoked1++; return parseInt(x) * 2; })
  //     .average((x: number) => { invoked2++; return x / 2; })
  //     .do(null, null, () => {
  //       expect(invoked1).to.equal(7);
  //       expect(invoked2).to.equal(7);
  //     });
  //
  //   expectObservable(r).toBe(expected, values);
  //   expectSubscriptions(a.subscriptions).toBe(asubs);
  // });
  //
  // it('should do multiple averages using a custom thisArg', () => {
  //   const a =    hot('--1--2--3--4--|');
  //   const asubs =    '^             !';
  //   const expected = '--a--b--c--d--|';
  //   const values = {a: 11, b: 14, c: 17, d: 20};
  //
  //   function Filterer() {
  //     this.selector1 = (x: string) => parseInt(x) + 2;
  //     this.selector2 = (x: string) => parseInt(x) * 3;
  //   }
  //   const filterer = new Filterer();
  //
  //   const r = a
  //     .average(function (x) { return this.selector1(x); }, filterer)
  //     .average(function (x) { return this.selector2(x); }, filterer)
  //     .average(function (x) { return this.selector1(x); }, filterer);
  //
  //   expectObservable(r).toBe(expected, values);
  //   expectSubscriptions(a.subscriptions).toBe(asubs);
  // });
  //
  // it('should not break unsubscription chain when unsubscribed explicitly', () => {
  //   const a =   cold('--1--2--3--|');
  //   const unsub =    '      !     ';
  //   const asubs =    '^     !     ';
  //   const expected = '--x--y-     ';
  //
  //   const r = a
  //     .mergeMap((x: string) => Observable.of(x))
  //     .average(addDrama)
  //     .mergeMap((x: string) => Observable.of(x));
  //
  //   expectObservable(r, unsub).toBe(expected, {x: '1!', y: '2!'});
  //   expectSubscriptions(a.subscriptions).toBe(asubs);
  // });
});

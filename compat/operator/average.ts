import { average as higherOrderMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export function average<T, R>(this: Observable<T>, project: (value: T, index: number) => R, thisArg?: any): Observable<R> {
  return higherOrderMap(project, thisArg)(this);
}

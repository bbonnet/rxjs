import { Observable } from 'rxjs';
import { average } from '../../operator/average';

(Observable as any).prototype.average = average;

declare module 'rxjs/internal/Observable' {
  interface Observable<T> {
    average: typeof average;
  }
}

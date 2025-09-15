import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { ScreenSize } from '../shared/types/screen-size.type';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  screenSize$: Observable<ScreenSize>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.screenSize$ = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet, Breakpoints.Web])
      .pipe(
        map((result) => {
          if (result.breakpoints[Breakpoints.Handset]) {
            console.log('handset', result.breakpoints);
            return 'handset';
          }
          if (result.breakpoints[Breakpoints.Tablet]) {
            console.log('tablet', result.breakpoints);
            return 'tablet';
          }
          if (result.breakpoints[Breakpoints.Web]) {
            console.log('web', result.breakpoints);
            return 'web';
          }
          console.log('???', result.breakpoints);
          return 'web';
        }),
        shareReplay(1)
      );
  }
}

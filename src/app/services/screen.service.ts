import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { ScreenSize } from '../shared/types/screen-size.type';
import { BREAKPOINTS } from '../shared/constants/breakpoints';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  screenSize$: Observable<ScreenSize>;
  breakpoints = BREAKPOINTS;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.screenSize$ = this.breakpointObserver
      .observe([this.breakpoints.Handset, this.breakpoints.Tablet, this.breakpoints.Web])
      .pipe(
        map((result) => {
          if (result.breakpoints[this.breakpoints.Handset]) {
            //console.log('handset', result.breakpoints);
            return 'handset';
          }
          if (result.breakpoints[this.breakpoints.Tablet]) {
            //console.log('tablet', result.breakpoints);
            return 'tablet';
          }
          if (result.breakpoints[this.breakpoints.Web]) {
            //console.log('web', result.breakpoints);
            return 'web';
          }
          //console.log('???', result.breakpoints);
          return 'web';
        }),
        shareReplay(1)
      );
  }
}

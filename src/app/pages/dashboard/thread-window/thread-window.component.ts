import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ChatActiveRouterService } from '../../../services/chat-active-router.service';
import { switchMap, map } from 'rxjs';
import { CurrentThreadInputComponent } from './current-thread-input/current-thread-input.component';
@Component({
  selector: 'app-thread-window',
  imports: [CommonModule, CurrentThreadInputComponent],
  templateUrl: './thread-window.component.html',
  styleUrl: './thread-window.component.scss'
})
export class ThreadWindowComponent {

  private route = inject(ActivatedRoute);
  private chatService = inject(ChatActiveRouterService);

  typ$!: Observable<string>;
  currentType!: string;
  currentChannelId!: string;

    // Observabile pentru parametrii din URL
messageId$ = this.route.paramMap.pipe(
  map(params => params.get('messageId')!)
);

type$ = this.route.paramMap.pipe(
  map(params => params.get('type')!)
);

channelId$ = this.route.paramMap.pipe(
  map(params => params.get('id')!)
);

messageInfo$!: Observable<any>;

ngOnInit() {
  this.messageInfo$ = combineLatest([this.type$, this.channelId$, this.messageId$]).pipe(
    switchMap(([type, id, messageId]) => 
      this.chatService.getThreads(type, id, messageId),
    )
  );

}
}

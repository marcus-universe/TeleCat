import{R as e}from"./CoqayA1T.js";const r=e("store",{state:()=>({previewState:!0,playState:!1,speed:100,textContent:`# Nya 😺 to TeleCat!
This is the best **Open Source Telepromter App** for you and your cat 😺

## First Steps
<ul>
  <li>On the top right corner you can switch between preview and edit mode.</li>
  <li>On the top left corner you find Settings to customize the preview look.</li>
  <li>Change the scroll direction with the two arrows next to the play button</li>
  <li>Inside the edit view you can use markdown syntax to style your promter content</li>
</ul>

> Consider contributing to the **Open Source Community** to support this project ❤️`,settings:{open:!1,mirroredX:!1,mirroredY:!1,colorText:"#eeeeee",colorBackground:"#181818",direction:!0,fontScale:1.5,sidePadding:8}}),getters:{},actions:{switchPreviewState(){this.previewState=!this.previewState},togglePlayState(){this.playState=!this.playState},setSpeed(t){this.speed=t},setSettingsOpen(){this.settings.open=!this.settings.open},toggleDirection(){this.settings.direction=!this.settings.direction},toggleMirroredX(){this.settings.mirroredX=!this.settings.mirroredX},toggleMirroredY(){this.settings.mirroredY=!this.settings.mirroredY}}});export{r as u};

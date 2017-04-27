# text-explorer
GUI Tool that runs in Chrome to explore large text/docs/json arrays with regular expressions

Loads json file in a service worker where it also performs live regex searches without blocking UI and with interactive preview (useful with more than 100K documents).

The limit in file size is Chrome memory. It will let you know when it's too big, by crashing.

![text-explorer](https://cloud.githubusercontent.com/assets/966787/25501805/606d5c8e-2b6a-11e7-806e-f385e08e2ba1.gif)

## To run

Host folder in any kind of static http server (for example, you can load the folder in an IDE such as Webstorm and right-click `text-explorer.htm` then 'Open in browser')


# text-explorer
Drag a large text/json text file and start exploring it with regular expressions and searches in realtime and with a smooth UI.

**Use it and try it here:** [https://jsilveira.github.io/text-explorer/text-explorer.htm](https://jsilveira.github.io/text-explorer/text-explorer.htm) dragging your JSON file*

.json files are parsed as JSON (as one large array of strings or objects where values are the strings), any other kind of file is splitted and read line by line.

![text-explorer](https://cloud.githubusercontent.com/assets/966787/25501805/606d5c8e-2b6a-11e7-806e-f385e08e2ba1.gif)

## How it works

Everything runs in the client, a Google Chrome page. It loads the file in a separate service worker, and all the searches and processing runs there without blocking the UI. Searches on large files also provide instant feedback on a subset of documents so you can create and tweak your regular expression without waiting for the filter on the whole data set. None of the data leaves your local browser, nothing is uploaded.

The limit in file size is Chrome's memory. It will let you know when it's too big, by crashing. A modern laptop should handle a 100mb of text without problems.

## To run your own instance

Host folder in any kind of static http server (for example, if you load the project in an IDE such as Webstorm and right-click `text-explorer.htm` and then 'Open in browser')

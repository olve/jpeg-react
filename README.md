jpeg-react
==========
A fully client-side webapp for analyzing/editing JPEG files.
(particularly handy for removing/editing EXIF metadata)

Demo at: http://nana.io/jpeg

Usage
------
Drop some JPEG files anywhere on the page (you can keep dropping  files anywhere at any time to keep adding files). This will display a list of every part (segment of bytes) in the JPEG. Parts can be removed by unchecking their checkboxes.

Exif metadata and file-comments are editable.

change your desired filename at the top and press the save-button to save as a new file with your edited metadata, without any of the removed segments.

To-do:
------
0. fix handling of XP tags (editing XPAuthor, XPTitle, etc does not work)
0. handling of XML metadata
0. add a worker for compiling EXIF segments to bytes (They are in the main-thread and add some lag).
0. add progress-indicators (clicking the save button ONLY saves the file, which makes you wonder whether anything actually happened)
0. make app more robust (There have been instances of the app crashing when dropping funky files)
0. style the app, remove all development-helpers (materializecss and material-ui look like good options)
0. make version available with precompiled JSX
0. add help for new users.
0. fix JPEG encoding (converting BMP to JPEG adds artifact stripes)
0. make BMP save-button use FileManager's save button.
0. make file-selector (drag&drop is the only option for selecting files right now)
0. add bulk-handling of files (We have support for multiple files and tabs; make it possible to set "Jack" as the artist of every open file)
0. add/remove new JPEG-parts (most importantly EXIF segments, and then adding new EXIF tags.)
0. decode image-data and save as different container format
0. add support for mp3s (they use EXIF)
0. add support for other file-types; the app is structured with file.js in a way that makes this relatively easy (try dropping a .png file)

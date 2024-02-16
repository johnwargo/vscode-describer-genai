# VSCode Describer GenAI Extension

A Visual Studio Code extension that generates a description of an article using Generative AI (GenAI) and ChatGPT and adds it to YAML front matter for the article. The extension targets users who use Visual Studio Code to edit blog posts for static site generators (like Eleventy).

## Prerequisites

The extension uses ChatGPT 3.5 and requires that you have an active ChatGPT account and API key.

It also assumes you have an active file open in the editor that consists of a YAML front matter section at the top and the body of the article/post below it as shown in the following example:

```markdown
---
title: My Meat Post
description: 
date: 2024-02-16
categories:
  - Miscellaneous
---

Bacon ipsum dolor amet chicken cupim frankfurter pancetta corned beef. Tenderloin beef ribs chislic turducken spare ribs sausage ham hock leberkas. Spare ribs picanha strip steak landjaeger short loin, pig kevin shoulder rump sirloin venison. Turducken frankfurter swine spare ribs, tail drumstick t-bone hamburger doner ham meatball kevin. Sirloin landjaeger sausage leberkas meatball chislic swine tongue strip steak chicken.

Prosciutto sausage buffalo meatball beef ribs hamburger ribeye tail cupim drumstick turducken kevin chicken. Pancetta beef ribs filet mignon pork belly salami prosciutto. Pork belly turducken meatloaf doner meatball. Tail t-bone beef ribs filet mignon. Meatloaf cupim pastrami cow ham.

Meatloaf kevin andouille turkey. Sausage shank ham hock swine leberkas pastrami boudin buffalo frankfurter. Turducken venison beef ribs turkey, salami filet mignon pig tail pork chop biltong strip steak jowl short ribs cupim. Pastrami chuck sausage alcatra cupim. Spare ribs leberkas ham beef, turducken pastrami ball tip shoulder landjaeger shankle andouille turkey. Tail pork chop strip steak brisket sirloin turkey beef pork belly.
```

**Note:** The extension doesn't require that the front matter has a `description` field defined; in the extension's configuration (described below) you specify the front matter property used to store the generated description and the extension will create the property automatically during generation.

## Configuration

You must configure the extension before you can use it; the extension requires an active ChatGPT API key to generate descriptions. To configure the extension, open the Visual Studio Code **Command Pallette** and select **Open Describer Settings** as shown in the image below.

![Visual Studio Code Command Pallette](https://github.com/johnwargo/vscode-describer-genai/blob/main/images/command-pallette.png)

The Settings page for the extension will open as shown below. The only configuration setting you must provide is the ChatGPT API key. 

![Describer Settings Window](https://github.com/johnwargo/vscode-describer-genai/blob/main/genai/images/describer-settings.png)

The following table describes the configuration options.

| Configuration Option  | Description |
| --------------------- | ----------- |
| API Key               | Populate this property with a valid ChatGPT API key; the extension cannot generate descriptions without access to the API. To obtain an API Key refer to [How can I access the ChatGPT API?]( https://help.openai.com/en/articles/7039783-how-can-i-access-the-chatgpt-api). |
| Enable Generated Flag | When you enable this option the extension adds a `generated` property to the front matter and sets its value to `true`. Use this option if you want your site to indicate when a description was generated using GenAI rather than human effort. |
| Target Property       | By default, the extension writes the generated description to the file's `description` front matter property. To write the description to a different front matter property, enter the property name here. |

## Operation

To generate a description for an article using the extension, right-click in an open file and select **Generate Description**. The extension will click and whir for a while then append the description to the front matter. 

![Right-click menu example](https://github.com/johnwargo/vscode-describer-genai/blob/main/images/right-click-menu.png)

The extension offers two commands:

* `generate` grabs the content from the currently open file, asks ChatGPT to summarize it, then writes the summary to the YAML front matter `description` property.
* `config` opens the configuration settings for the extension.



***

Sample content generated using [Bacon Ipsum](https://baconipsum.com/)


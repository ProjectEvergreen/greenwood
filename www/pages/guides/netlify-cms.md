---
title: 'Netlify CMS'
collection: guides
tocHeading: 3
order: 8
---

## Using a CMS

To make your life easier creating content, you can use content management systems such as [Netlify CMS](https://www.netlifycms.org/).  We've created a guide here to help make things easy to setup.

This guide builds off the previous guides. If you haven't been following along, you can simply fork the [greenwood-getting-started](https://github.com/ProjectEvergreen/greenwood-getting-started) repo and continue from there.

You will also need a free [netlify account](www.netlify.com).

<img src="/assets/netlify-cms.jpg" alt="netlify-cms" style="max-width:800px;"/>

### Setup Netlify CMS

Assuming you've forked the getting-started repo and cloned it or you've continued from the previous guides, we first need to create a configuration file.

Within your project's directory, create a folder `public` and within it create another folder `admin`

#### Configure

Inside the `public/admin/` directory create a file called `config.yml` this will contain the necessary Netlify configuration for each individual project.

```yaml
backend:
  name: git-gateway
  branch: master # Branch to update (optional; defaults to master)
publish_mode: editorial_workflow
media_folder: "public/images/uploads" # Media files will be stored in the repo under images/uploads
public_folder: "/images/uploads" # The src attribute for uploaded media will begin with /images/uploads

collections:
  - name: "blog" # Used in routes, e.g., /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "src/pages/blog" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Body", name: "body", widget: "markdown"}
```
> You can read more about these configuration options on [Netlify's guide](https://www.netlifycms.org/docs/add-to-your-site/#configuration)

This will provide us with the bare minimum needed to configure the admin UI of the Netlify CMS within our project.


#### Admin UI

Inside the `public/admin/` directory create another file called `index.html` this will contain the necessary Netlify CMS interface and identity widget.

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>

```

#### Identity Widget

Along with the admin UI, we also need to read the identity widget script element within our app layout so that it will be accessible from any page.  Within our `src/layouts/app.html` you need to add the following script element within the function:

```html
<head>
  ...
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  ...
</head>
```

> Later, when you're doing this with a your own projects, make sure you either:
>* a) add this line to all of your custom page layouts or
>* b) add this line to your app layout

With that completed, save and recommit all your changes to your repository. If you haven't already pushed your code to a repository on github, you must do so in order to mirror it on netlify.

### Netlify Your Project


#### Create New Project

Now we can return to Netlify.com make sure you register, login, and click "new site from git" button.

<img src="/assets/netlify-create-new.png" alt="netlify-create-new" style="max-width:800px;"/>


Click GitHub and then you must authorize netlify to read your repositories.

Finally, select your project's repository then and the build command: `npm run build` and the publish directory: `public` like this:

<img src="/assets/netlify-deploy.png" alt="netlify-deploy" style="max-width:700px;"/>

Click **Deploy Site** and you're site will now be deployed to a randomly generated url at netlify.com

### Configure Authentication

Click **site settings** button, then select **Identity** from the left side menu.

Click the **Enable Identity** button

It's up to you if you want registration to be open/invite only.  Click **Edit Settings** Under the **Registration preferences** subheading to change between open/invite.

<img src="/assets/netlify-registration.png" alt="netlify-registration" style="max-width:800px;"/>

Under **External Providers** in the drop down menu click "Add Provider" -> "GitHub" and then **Enable Github**

If you chose **invite only** are you registration method, you need to invite yourself and others using the "Identity" page which is linked at the top navigation bar. From here you can click **Invite Users** to invite any email address you need.

<img src="/assets/netlify-invite.png" alt="netlify-invite" style="max-width:700px;"/>


#### Configure Services

The final step is to **Enable Git Gateway** from the **Services** Menu

Click **Edit Settings** then click "Generate access token in Github"

<img src="/assets/netlify-git-gateway.png" alt="netlify--git-gateway" style="max-width:800px;"/>

To automatically generate an access token from and for the GitHub API

#### Access Netlify CMS

Your site is now deployed and configured, you can now login and access your Netlify CMS from:
 `https://yourgeneratedurl-ads6387.netlify.com/admin`

### Using Netlify CMS

If you've been following along, you should now be viewing the netlify CMS admin gui at your netlify domain `https://yourgeneratedurl-ads6387.netlify.com/admin`.

From this page, you can see the default `blog` content type that we added in our netlify cms configuration file. When we create and publish a new `blog` page it will publish to the `/public/blog` folder in your repository.

<img src="/assets/netlify-admin.png" alt="netlify-cms" style="max-width:800px;"/>

#### Create Content

Click **New Blog** button. You will be greeted with a WYSIWYG(what you see is what you get) content form.

<img src="/assets/netlify-cms.jpg" alt="netlify-cms" style="max-width:800px;"/>

Add a **title** of `example` which will be used for our page's URL, as defined by our configuration. For example the title `Hello World Howdy` would be available at the url https://yourgeneratedurl-ads6387.netlify.com/blog/hello-world-howdy when published.

Add whatever content you would like.  If you wish to upload images through netlify's CMS they will be placed in `/public/assets` as defined by your netlify configuration.

When completed click **Save** at the top.  A pull request will automatically be submitted to your repository of your draft page.

#### Review Your Content

You can change the **status** to "In Review". Netlify CMS will then tag that same pull request as `netlify-cms/pending_review`.  Pending reviews can be read by selecting **Workflow** from Netlify CMS navigation menu.

<img src="/assets/netlify-workflow.png" alt="netlify-cms" style="max-width:800px;"/>

If you select your example page from the `In Review` section you can edit/update/delete the page.

#### Publish Your Content

From the top of the page select **Publish** and then from the drop-down select **Publish now**

Your pull request will now be merged to the master branch. The entire site will be recompiled on Netlify. In a few moments your new page will be live at your netlify domain `https://yourgeneratedurl-ads6387.netlify.com/blog/example`.

More information about Netlify CMS can be found on the [Netlify CMS project website](https://www.netlifycms.org/).
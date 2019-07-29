## Creating Pages


### First Page

Let's create our first page. In your `src/pages` directory create a new file called `index.md`.

Within it we can add the following content:


```render md

### Hello

Helloworld

```

Save it and check [http://localhost:1984](http://localhost:1984) to see your new page.


### First Directory

Our second page we want to use a unique route address to access it.

For example http://localhost:1984/blog

To do this, create a new folder within `src/pages` called `blog`.  Within `src/pages/blog` add a new file called `index.md`

Within it we can add the following content:


```render md

## Blog

My Blog overview.

Hello everybody.
```

Save it. You can now view this page at [http://localhost:1984/blog](http://localhost:1984/blog)

This is a basic markdown page. You can add any standard markdown formatting. See [markdown docs](/docs/markdown) for further information.

### First Blog Post

Our third page we want to create a new blog posting within our blog route.

Create a new file within `src/pages/blog` called `first-post.md`.

Within it we can add the following content:


```render md

## My First Blog Post

This is my first blog post

```

Save it. You can now view this page at [http://localhost:1984/blog/first-post](http://localhost:1984/blog/first-post)


---
[Next Step: Configuration](/getting-started/configuration)


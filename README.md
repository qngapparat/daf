<h1 align="center">DAF</h2>
<h2 align="center">Dependency-aware FaaSifier</h2>

DAF lets you outsource parts of a NodeJS app to FaaS

In addition to existing tools, it supports:

* Dependencies ([`install`](#install))
* Importing other files and functions ([`require`](#require))
<!-- * Global variables ([`vars`](#vars)) -->



## Install

```shell
npm i -g daf # install globally
```

## Usage

### 1. Add annotations in your Monolith code:

```js
// l     
var a = 1;
// lend 
```

The enclosed code will be packaged into a FaaS function.

### 2. Run DAF via Editor Extension:

Search for [DAF-VSCode](https://marketplace.visualstudio.com/items?itemName=qngapparat.daf-vscode) on the VSCode Marketplace.
    
### 2. Run DAF via CLI (Alternative, not recommended):

```shell
$ daf OPTIONS... 
```
Options: 

* `--fpath PATH`: The path to the `.js` file in which you want to faasify code
* `--linenum NUM`: The line number of the `// l ...` Annotation (**starts at 0**)
* `--outpath PATH`: The path where the generated FaaS functions will be put (`outpath/lambdas/...`)
* [`--commentout`]: If specified, the faasified section will be replaced with an Lambda API call. Only works if you specified [`//l name(...)`](#name)!


### 3. Output

The tool creates an equivalent Lambda function of that section in `[--output]/lambdas/[name]`:


```
└── lambdas
    └── 28723n2398jfs9f87239uhfe9
        ├── index.js
        └── package.json 
```

You can zip this folder and upload it directly to Amazon Lambda.
One file can have multiple `// l` ... `// lend` sections, that can be converted separately.


## Annotation syntax

`//l` can be followed by any combination of these space-separated directives.

### `name`

You can give your Lambda a name to better keep track of it:

```js
// l name(mylamb)
 var a = 1
// lend
```

```
└── lambdas
    └── mylamb
       └── ....
    
```


<!-- 

### `vars`

Your code might rely on global variables. You can denote them with `vars()`:

```js
var a = 1
// l vars(a)
a++
// lend
```

They will be added to the scope inside the Lambda.

-->

### `require`

Your code might rely on functions from other files. You can declare that using `require()`:

```js
// l require(./foo.js as foo)
foo()
// lend
```

A portable version of `foo.js` is then included in the deployment package, and it is added to the scope inside the Lambda.

```
└── lambdas
    └── myfunc
       └── foo.js  // <---
       └── ...
```

If `foo` in turn depends on other functions or dependencies, they are bundled as well (recursively) using webpack. 

### `install`

Your code might depend on NPM packages. You can specify them with `install()`. They will be included in your deployment package.

```js
// l install(opencv2)
....
// lend
```

You probably want to import it as well:

```js 
// l install(opencv2) require(opencv2 as opencv2)
   opencv2.detectFaces(...)
// lend
```

### `return`

Your monolith code may have no return statement. To receive something back from the lambda, use `return()`
```js
// l return(a)  
  var a = 1
  var b = 2
// lend
```


-----

## Useful hints

### Multiple parameters

With most `// l` expressions, you can provide a comma-separated list too:

```js
// l install(lodash, rollup, express)
...
```
<!--
### Aliasing

You can rename functions and packages, when importing them:

```js
// l require(opencv2 as cv)
  cv.detectFaces(...)
// lend
```

For functions this is obligatory:

```js
// l require(./external.js as external)
  ...
// lend
``` 


### Versioning

You can specify the exact versions of the NPM packages to install:

```js
// l install(pkg1@latest, pkg2^1.0.0, pkg3>=1.2.3)
...
// lend
```

The syntax follows this official schema: https://docs.npmjs.com/misc/semver

-->

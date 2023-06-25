---
layout: post
title: "Create a NodeJS project with Typescript & Jest"
date: 2023-06-25 00:00:00 +0800
categories: node nodejs typescript jest tsconfig git
description: The commands you need to get started with your TS NodeJS project plus some explanations about the project configuration.
---

Let's just get the boring stuff out the way.

Open a terminal and navigate to your project directory.

Run the following two commands:

```
npm init -y
npm i -D typescript jest @types/jest ts-jest
```

Create a `tsconfig.json` file then add the following json config:
```
{
    "compilerOptions": {
        "module": "CommonJS",
        "target": "ES2022",
        "outDir": "build",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["**/*.test.ts"]
}
```

Open the `package.json` file.

Replace the `main` value to `"main": "build/main.js",`.

Replace `scripts` with: 

```
"scripts": {
    "build": "tsc",
    "test": "jest",
    "start": "node ."
  },
```

Below `scripts` add your jest config: 

```
"jest": {
    "preset": "ts-jest"
  },
```

To run some typescript code, create a folder called `src` and add a file, `main.ts`.

Within `main.ts` add the following code: 

```
function main(input: string) {
    console.log(input);
}

main('hello world');
```

In your terminal run the following commands:

```
npm run build
npm run start
```

# You're done!

That's pretty much it for standing up a NodeJS project with Typescript and Jest. Now you can begin writing the code you want to write.

# Bonus Setup - Add Git to your project

Run `git init` to create a local git repository in the current directory.

Create a file, `.gitignore` and add the following config files:

```
node_modules
build
```

Run: 

```
git add .
git commit -m 'initial commit'
```

If you have a remote repo configured you can set it as your origin with:

```
git remote add origin <https://your/remote/repo.git>
```

The push your changes with `git push origin main`.

# An explanation of the above

## What is NodeJS?

NodeJS is a runtime environment for javascript applications. The runtime is built on top of the Google Chrome V8 Javascript Engine. This engine compiles Javascript code to a lower-level language in order to make it more efficient. This enables the use of Javascript for writing web servers, which NodeJS is predominantly used for.

## What does npm init -y do?

`npm init` is used to create a `package.json` file. This file contains metadata for a NodeJS project.  
`-y` creates this file using all default properties. If `-y` is omitted, then the following prompts will be displayed while generating the file:

1. **package name** - the name of the package/project. Default is the directory name
2. **version** - the version number of the package. Default is `1.0.0`
3. **description** - A description of the package. Default is `""`
4. **entry point** - The entrypoint of the package. This is the value of the `main` attribute in the `package.json` file. Default is `index.js`
5. **test command** - This is the `test` script value. Default is `echo \"Error: no test specified\" && exit 1`
6. **git repository** - The git repository of the package. Default is no entry
7. **keywords** - Any keywords associated with the package. Default is no entry
8. **author** - The author of the package. Default is `""`
9. **licence** - The package license. Default is `ISC`

## What does npm i -D typescript jest @types/jest ts-jest do?

`npm i` is shorthand for `npm install`. This command is used to install publicly available npm packages for use in a NodeJS project.  
`-D` is shorthand for `--save-dev`. this flag indicates that the packages to download are only for local development and not required for production. Packages downloaded using this flag are added to the `devDependencies` field in the `package.json` file. Omitting this flag adds the packages to the `dependencies` field.

* [typescript](https://www.npmjs.com/package/typescript) is the npm package that extends javascript to include a type system. Typescript files are identified via the `.ts` file extension. These `.ts` files can be transpiled into javascript with the `tsc` command.
* [jest](https://jestjs.io/) is a  modern javascript testing framework.
* [@types/jest](https://www.npmjs.com/package/@types/jest) is a package containing type definitions for Jest.
* [ts-jest](https://www.npmjs.com/package/ts-jest) a Jest transformer for Typescript

## What is the tsconfig.json file for?

[tsconfig](https://www.typescriptlang.org/tsconfig) contains various configurations for how your typescript modules should be transpiled into javascript. 

* [CompilerOptions](https://www.typescriptlang.org/tsconfig#compilerOptions) describes the output of your javascript modules. The properties provided above are: 
    * [module](https://www.typescriptlang.org/tsconfig#module) - describe the module system, e.g. ESM, CommonJS, AMD, etc
    * [target](https://www.typescriptlang.org/tsconfig#target) - The ECMAScript target version. This determines what features are downgraded during transpilation and which are left intact
    * [outDir](https://www.typescriptlang.org/tsconfig#outDir) - Where the transpiled `.js` files are emitted
    * [esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop) - Enabling resolves some default assumptions the Typescript transpiler makes about alternate module systems
    * [forceConsistentCasingInFileNames](https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames) - Enabling this feature forces file imports to match the file casing on disk
    * [strict](https://www.typescriptlang.org/tsconfig#strict) - Enables a range of type-checking behaviour which leads to stronger guarantees of program correctness
* [include](https://www.typescriptlang.org/tsconfig#include) lists the directories and files that should be transpiled into javascript.
* [exclude](https://www.typescriptlang.org/tsconfig#exclude) lists the directories and files that should not be transpiled. e.g. test files.

## What is the jest preset?

Within your jest config you can define a base configuration as your [preset](https://jestjs.io/docs/configuration#preset-string) that targets an npm module, in this case we're using ts-jest.

# Conclusion
The above guide should be viewed as a generic guide to get your project up and running. Different/additional configuration options may be required based on your project needs.
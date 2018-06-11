## 异步流程控制
什么是异步？？
执行一个任务完成后，中间去执行其他的事件，最后再回来执行这个任务(回调)，不连续.场景如: setTimeout, ajax请求, fs.read以及数据库查询等操作。一般地，我们都是在其回调函数里去操作，这样才能保证所需要的数据加载完成再进行后续操作，但是这样会引起一个问题：如果操作的步骤很多，那么嵌套的层数必定会变得很多，这就是我们常说的"回调地狱"，我们常见的三种解决方式如下。
### Promise
Promise对象代表一个异步操作，有pending(进行中)、fulfilled(已成功)、rejected(已失败),只有异步操作的结果可以决定当前是哪种状态，基本的流程图可以表示为：
<img src='https://mdn.mozillademos.org/files/8633/promises.png'>
需要注意的点：
1. Promise新建后会立即执行
```
    let promise = new Promise(function(resolve, reject) {
      console.log('Promise');
      resolve();
    });
    
    promise.then(function() {
      console.log('resolved.');
    });
    
    console.log('Hi!');
```
依次输出: Promise, Hi!, resolved. 

2. Promise的状态传递
```
    const p1 = new Promise(function (resolve, reject) {
      setTimeout(() => reject(new Error('fail')), 3000)
    })
    
    const p2 = new Promise(function (resolve, reject) {
      setTimeout(() => resolve(p1), 1000)
    })
    
    p2
      .then(result => console.log(result))
      .catch(error => console.log(error))
    // Error: fail
```
上面p1是一个Promise，3s后变为reject。p2的状态在1s后改变，resolve方法返回的是p1.由于p2返回的是另一个Promise
导致自己的状态失效了，由p1的状态决定p2的状态，所以p2后面的then都变成了针对p1.又过2s，p1变为rejected， 导致触发catch指定的回调函数触发。

3. 调用resolve或reject并不会终结 Promise 的参数函数的执行，可以加return

4. Promise 对象后面要跟catch方法，这样可以处理 Promise 内部发生的错误。catch方法返回的还是一个 Promise 对象，因此后面还可以接着调用then方法。

5. Promise.all方法用于将多个 Promise 实例并行执行，返回一个Promise，该promise会等promise集合内的所有promise都被resolve后被resolve，或以第一个promise被reject的原因而reject，用处：对于执行顺序不重要的任务可以使用。

6. Promise.race(promise集合)方法返回一个promise，这个promise在promise集合中的任意一个promise被解决或拒绝后，立刻以相同的解决值被解决或以相同的拒绝原因被拒绝。

7. Promise.resolve()能将thenable对象，Promise实例，无参数等转成Promise对象。

如果我们需要将多个异步按顺序执行，又改如何处理呢？处理方法：
```
   urls.reduce((previousValue, currentValue) => {
    return previousValue.then(() => Axios.get(currentValue))
   }, Promise.resolve()) 
```
具体实例可以阅读：https://juejin.im/post/59cdb6526fb9a00a4e67c7fb#heading-2
### generator函数
Generator 函数是 ES6 提供的一种异步编程解决方案，函数会返回一个遍历器对象。返回的遍历器对象可以依次遍历 Generator 函数内部的每一个状态。
```
    function* foo(x) {
      var y = 2 * (yield (x + 1));
      var z = yield (y / 3);
      return (x + y + z);
    }
    
    var a = foo(5);
    a.next() // Object{value:6, done:false}
    a.next() // Object{value:NaN, done:false}
    a.next() // Object{value:NaN, done:true}
    
    var b = foo(5);
    b.next() // { value:6, done:false }
    b.next(12) // { value:8, done:false }
    b.next(13) // { value:42, done:true }
```
以上可以看出，当next参数为空时，yield表达式返回的是undefined，不为空时，yield表达式返回值等于参数值。但是Generator 函数将异步操作表示得很简洁，但是流程管理却不方便。
* 注意点:
1. ES6 规定这个遍历器是 Generator 函数的实例，也继承了 Generator 函数的prototype对象上的方法。
2. Generator函数不能跟new 命令一起用，会报错，以下是解决办法：
```
    function* F () {
        this.a = 1;
        yield this.b = 2;
        yield this.c = 3;
    } 
    var obj = {};
    var f = F.call(obj);
    f.next();
    f.next();
    f.next();
```
首先，生成一个空对象，使用call方法绑定 Generator 函数内部的this。这样，构造函数调用以后，这个空对象就是 Generator 函数的实例对象了。
* Thunk函数
自动化执行Generator函数的一种方法, (注意其中高阶函数的使用)。
```
    // es5版本
    var Thunk = function(fn) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            args.push(fn);
            return fn.apply(this, args);
        }
    }
    // es6版本
    const Thunk = function(fn) {
        return function (...args) {
            return function (callback) {
                return fn.call(this, ...args, callback)
            }
        }
    }
    function f(a, cb) {
        cb(a);
    }
    const ft = Thunk(f);
    ft(1)(console.log)
```
捕获错误机制如下：
```
    function* g() {
      yield 1;
      console.log('throwing an exception');
      throw new Error('generator broke!');
      yield 2;
      yield 3;
    }
    
    function log(generator) {
      var v;
      console.log('starting generator');
      try {
        v = generator.next();
        console.log('第一次运行next方法', v);
      } catch (err) {
        console.log('捕捉错误', v);
      }
      try {
        v = generator.next();
        console.log('第二次运行next方法', v);
      } catch (err) {
        console.log('捕捉错误', v);
      }
      try {
        v = generator.next();
        console.log('第三次运行next方法', v);
      } catch (err) {
        console.log('捕捉错误', v);
      }
      console.log('caller done');
    }
    
    log(g());
    // starting generator
    // 第一次运行next方法 { value: 1, done: false }
    // throwing an exception
    // 捕捉错误 { value: 1, done: false }
    // 第三次运行next方法 { value: undefined, done: true }
    // caller done
```
一旦 Generator 执行过程中抛出错误，且没有被内部捕获，就不会再执行下去了。如果此后还调用next方法，将返回一个value属性等于undefined、done属性等于true的对象，即 JavaScript 引擎认为这个 Generator 已经运行结束了。
* Generator函数的流程管理
Thunk函数可用于Generator函数的自动流程管理.如下例：
```
    function run(fn) {
        var gen = fn();
        function next(err, data) {
            var result = gen.next(data);
            if (result.done) {
                return;
            }
            result.value(next);
        }
        next();
    }
    function* g() {}
    run(g);
```
因为自动执行的关键是，必须有一种机制，自动控制 Generator 函数的流程，接收和交还程序的执行权。回调函数可以做到这一点，Promise 对象也可以做到这一点。
```
    var fs = require('fs');
    
    var readFile = function (fileName){
      return new Promise(function (resolve, reject){
        fs.readFile(fileName, function(error, data){
          if (error) return reject(error);
          resolve(data);
        });
      });
    };
    
    var gen = function* (){
      var f1 = yield readFile('/etc/fstab');
      var f2 = yield readFile('/etc/shells');
      console.log(f1.toString());
      console.log(f2.toString());
    };
    
    function run (gen) {
        var g = gen();
        function next(data) {
            var result = g.next(data);
            if (result.done) return result.value;
            result.value(function(data) {
                next(data);
            });
        }
        next();
    }
    run(gen);
```
只要 Generator 函数还没执行到最后一步，next函数就调用自身，以此实现自动执行

### async函数
es2017引入async函数，它就是Generator的语法糖，使得异步操作更加简单。
原理：
```
    async function fn (args) {}
    // 等同于
    function fn(args) {
        return spawn(function* (){})
    }
    // spawn函数其实就是个自动执行器
    
    function spawn(genF) {
        return new Promise((resolve, reejct) => {
            const gen = genF();
            
            function step (nextF) {
                let next;
                try {
                    next = nextF();
                } catch(e) {
                    return reject(e);
                }
                if (next.done) {
                    return resolve(next.value);
                }
                Promise.resolve(next.value).then((v) => {
                    step(() => gen.next(v))
                }, (e) => {
                    step(() => gen.throw(e));
                });
            }
            step(() => gen.next(undefined));
        })
    }
```
其实，async函数就是将 Generator 函数的星号（*）替换成async，将yield替换成await，async再将Generator进行了一些改进。
async函数返回一个 Promise 对象，可以使用then方法添加回调函数。当函数执行的时候，一旦遇到await就会先返回，等到异步操作完成，再接着执行函数体内后面的语句。
如：
```
    function timeout(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }
    
    async function asyncPrint(value, ms) {
      await timeout(ms);
      console.log(value);
    }
    
    asyncPrint('hello world', 50);
```
* 注意点:
1. async 表示这是一个 async 函数，而 await 只能在这个函数里面使用。
2. await 后面紧跟着的最好是一个耗时的操作或者是一个异步操作(当然非耗时的操作也可以的，但是就失去意义了), 也就是正常情况下，await命令后面是一个 Promise 对象。如果不是，会被转成一个立即resolve的 Promise 对象。
3. 捕获错误 如果await后面的异步操作出错，那么等同于async函数返回的 Promise 对象被reject，所以await可以放到try catch中，又或者async本身就是返回一个Promise，后面也可加上then或catch捕获。
4. 如果多个await后面的异步操作不存在继承关系，可以使用Promise.all让他们并发执行，不然会耗性能。
5. await如果用在普通函数如forEach里就会报错.
```
    async function dbFuc(db) {
      let docs = [{}, {}, {}];
    
      // 报错
      docs.forEach(function (doc) {
        await db.post(doc);
      });
    }
    可以改为:
    function dbFuc(db) {
      let docs = [{}, {}, {}];
    
      // 报错
      docs.forEach(async function (doc) {
        await db.post(doc);
      });
    }
```

实例：假定某个 DOM 元素上面，部署了一系列的动画，前一个动画结束，才能开始后一个。如果当中有一个动画出错，就不再往下执行，返回上一个成功执行的动画的返回值。
```
    // 第一种方法Promise
    function chainAnimationsPromise(elem, animations) {
      // 变量ret用来保存上一个动画的返回值
      let ret = null;
    
      // 新建一个空的Promise
      let p = Promise.resolve();
    
      // 使用then方法，添加所有动画
      for(let anim of animations) {
        p = p.then(function(val) {
          ret = val;
          return anim(elem);
        });
      }
      // 返回一个部署了错误捕捉机制的Promise
      return p.catch(function(e) {
        /* 忽略错误，继续执行 */
      }).then(function() {
        return ret;
      });
    }
    
    // 第二种方法 Generator函数
    function chainAnimationsGenerator(elem, animations) {
    
      return spawn(function*() {
        let ret = null;
        try {
          for(let anim of animations) {
            ret = yield anim(elem);
          }
        } catch(e) {
          /* 忽略错误，继续执行 */
        }
        return ret;
      });
    
    }
    // 第三种方法 async函数
    async function chainAnimationsAsync(elem, animations) {
      let ret = null;
      try {
        for(let anim of animations) {
          ret = await anim(elem);
        }
      } catch(e) {
        /* 忽略错误，继续执行 */
      }
      return ret;
    }
    
```
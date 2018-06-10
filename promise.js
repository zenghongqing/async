// 三种状态
const PENDING = Symbol();
const FULFILLED = Symbol();
const REJECTED = Symbol();
/**
 * 构造一个myPromise类模拟Promise
 * @param fn {Function} 处理函数
 * */
class myPromise {
    constructor (fn) {
        if (typeof fn !== 'function') {
            throw new Error('fn is not a function')
        }
        this.$state = PENDING;          // 记录状态
        this.$chain = [];               // 链式调用函数的数组
        const resolve = (value) => {
            if (this.$state !== PENDING) {
                return;
            }
            if (value !== null && typeof value.then === 'function') {
                // 如果resolve返回一个myPromise,递归处理
                return value.then(resolve, reject);
            }
            this.$state = FULFILLED;
            this.$value = value;
            // 链式中的resolve操作
            for (let { onFulfilled } of this.$chain) {
                onFulfilled(value)
            }
            return value
        };
        const reject = (err) => {
            if (this.$state !== PENDING) {
                return;
            }
            this.$state = REJECTED;
            this.$value = err;
            // 链式中的reject操作
            for (let { onRejected } of this.$chain) {
                onRejected(err);
            }
        };
        try {
            fn(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }
    then (onFulfilled, onRejected) {
        // 返回一个myPromise对象, 以便链式调用
        return new myPromise((resolve, reject) => {
            const _onFulfilled = (res) => {
                try {
                    resolve(onFulfilled(res))
                } catch (e) {
                    reject(e)
                }
            };
            const _onRejected = (res) => {
                try {
                    reject(onRejected(res))
                } catch (e) {
                    reject(e)
                }
            };
            if (this.$state === FULFILLED) {
                _onFulfilled(this.$value);
            } else if (this.$state === REJECTED) {
                _onRejected(this.$value);
            } else {
                this.$chain.push({onFulfilled: _onFulfilled, onRejected: _onRejected});
            }
        })
    }
    catch (onRejected) {
        return this.then(undefined, onRejected)
    }
    all (promises) {
        let result = [],
            i = 0,
            len = promises.length,
            count = len;
        if (!Array.isArray(promises)) {
            throw new Error('You must pass an array to all.')
        }
        return new myPromise((resolve, reject) => {
            const resolver = (index) => {
                return (value) => {
                    resolveAll(index, value)
                }
            };
            const resolveAll = (index, value) => {
                result[index] = value;
                if (--count === 0) {
                    resolve(result)
                }
            };
            const rejecter = (reason) => {
                reject(reason);
            };
            for(; i < len; i++) {
                promises[i].then(resolver(i), rejecter);
            }
        })
    }
    race (promises) {
        if (!Array.isArray(promises)) {
            throw new Error('You must pass an array to race.')
        }
        return new myPromise((resolve, reject) => {
            let i = 0,
                len = promises.length;
            const resolver = (value) => {
                resolve(value);
            };
            const rejecter = (reason) => {
                reject(reason);
            };
            for (; i < len; i++) {
                promises[i].then(resolver, rejecter);
            }
        })
    }
}

let p = new myPromise(function (resolve, reject) {
    resolve('hello')
})
/**
 * 测试用例, 链式调用, all, race用法
 * */
p.then(res => {
    console.log(res)
    return 'world'
}).then(res => {
    console.log(res)
    return '1332'
}).then(res => {
    console.log(res)
    return new myPromise(function (resolve, reject) {
        resolve(545454)
    })
}).then((res) => {
    console.log(res)
}).catch(err => {
    console.log(err)
});

var getData100 = function(){
    return new myPromise(function(resolve,reject){
        setTimeout(function(){
            resolve('100ms');
        },1000);
    });
}

var getData200 = function(){
    return new myPromise(function(resolve,reject){
        setTimeout(function(){
            resolve('200ms');
        },2000);
    });
}
var getData300 = function(){
    return new myPromise(function(resolve,reject){
        setTimeout(function(){
            reject('reject');
        },3000);
    });
};
p.all([getData100(), getData200()]).then(res => {
    console.log(res, '111')
});

p.race([getData100(), getData200(), getData300()]).then(res => {
    console.log(res, 'race')
})
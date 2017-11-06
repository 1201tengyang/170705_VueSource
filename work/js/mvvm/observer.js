function Observer(data) {
    // 保存data
    this.data = data;
    // 启动监视
    this.walk(data);
}

Observer.prototype = {
    walk: function(data) {
        // 保存oberser对象
        var me = this;
        // 遍历data中所属性
        Object.keys(data).forEach(function(key) {
            // 对指定属性实现劫持
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        // 对指定属性实现劫持
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        // 为当前属性创建一个对应的dep对象
        var dep = new Dep();
        // 通过递归调用, 实现对所有层次属性的劫持
        var childObj = observe(val);
        // 为data重新定义属性: 添加getter/setter
            // setter: 实现数据的监视, 一旦数据变化了, 更新界面
            // getter: 用来建立dep与watcher之间的关系(n--n)
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() {
                if (Dep.target) {
                    // 建立dep与watcher之间的关系(n--n)
                    dep.depend();
                }
                return val;
            },
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知dep
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    // 必须是个对象
    if (!value || typeof value !== 'object') {
        return;
    }
    // 创建监视对象
    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },

    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        // 通知所有相关的watcher去更新
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};

Dep.target = null;
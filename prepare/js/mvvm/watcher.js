/**
 * 用于监视表达式数据变化的构造函数
 * @param vm: vm实例
 * @param exp: 某个指令的完整表达式
 * @param cb: 用于更新最新数据的回调函数
 */
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 各级子表达式所对应的dep的集合对象
    this.depIds = {};
    // 当前表达式的值
    this.value = this.get();
}

Watcher.prototype = {
    /*
    调用run()去实现界面更新
     */
    update: function() {
        this.run();
    },
    /*
    如果如果被监视的表达式的value有变化, 调用回调函数去更新对应的界面
     */
    run: function() {
        // 得到最新的值
        var value = this.get();
        // 得到老值
        var oldVal = this.value;
        // 如果不相等
        if (value !== oldVal) {
            // 保存新值
            this.value = value;
            // 调用更新的回调函数
            this.cb.call(this.vm, value, oldVal);
        }
    },
    /*
    如果dep与watcher的关系没有建立, 建立二者之间的关系
        将当前watcher添加到dep中
        将dep添加到当前watcher中
     */
    addDep: function(dep) {
        // 如果dep与watcher之间的关系还没有建立
        if (!this.depIds.hasOwnProperty(dep.id)) {
            // 将watcher添加到dep中
            dep.addSub(this);
            // 将dep添加到watcher中
            this.depIds[dep.id] = dep;
        }
    },

    /*
     获取当前表达式最新的值, 同时建立dep与watcher之间的关系(为后面更新做准备)
     */
    get: function() {
        Dep.target = this;
        var value = this.getVMVal();
        Dep.target = null;
        return value;
    },

    /*
    获取当前表达式最新的值
     */
    getVMVal: function() {
        var exp = this.exp.split('.');
        var val = this.vm._data;
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    }
};
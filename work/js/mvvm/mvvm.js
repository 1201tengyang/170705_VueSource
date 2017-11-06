/*
构造函数, 相当于Vue
options: 配置对象
 */
function MVVM(options) {
    // 保存配置对象到vm中
    this.$options = options;
    // 保存data数据对象到vm和data变量
    var data = this._data = this.$options.data;
    // 保存vm到me
    var me = this;

    // 遍历data中所有属性
    Object.keys(data).forEach(function(key) { // 属性名
        // 对指定属性名的属性实现数据代理
        me._proxy(key);
    });

    observe(data, this);

    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },

    _proxy: function(key) {
        // 保存vm
        var me = this;
        // 给vm添加指定名称的属性(使用属性描述符)
        Object.defineProperty(me, key, {
            configurable: false, // 不能再重新定义
            enumerable: true, // 可以枚举
            // 用来vm获取key属性值
            get: function proxyGetter() {
                // 读取data中对应的属性值
                return me._data[key];
            },
            // 监视vm中key属性值的变化
            set: function proxySetter(newVal) {
                // 将最新的属性值保存到data对应的属性上
                me._data[key] = newVal;
            }
        });
    }
};
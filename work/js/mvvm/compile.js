function Compile(el, vm) {
    // 保存vm
    this.$vm = vm;
    // 保存el元素对象
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    if (this.$el) {
        // 1. 取出el中所有子节点, 添加到一个framgent对象中, 并保存
        this.$fragment = this.node2Fragment(this.$el);
        // 2. 编译el中所有层次的子节点
        this.init();
        // 3. 将编译后的fragment添加到el中
        this.$el.innerHTML = ''
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function(el) {
        var fragment = document.createDocumentFragment(),
            child;



        var childrenHTML = el.innerHTML
        // el.innerHTML = ''
        var div = document.createElement('div')
        div.innerHTML = childrenHTML

        // 将原生节点拷贝到fragment
        while (child = div.firstChild) {
            fragment.appendChild(child);
        }


        return fragment;
    },

    init: function() {
        // 编译fragment中所有子节点
        this.compileElement(this.$fragment);
    },

    compileElement: function(el) {
        // 取出最外层的子节点
        var childNodes = el.childNodes,
          // 保存complile对象
            me = this;
        // 遍历子节点
        [].slice.call(childNodes).forEach(function(node) {
            // 得到节点文本内容
            var text = node.textContent;
            // 创建匹配大括号表达式的正则对象(包含匹配表达式字符串的子匹配)
            var reg = /\{\{(.*)\}\}/;
            // 如果是元素节点
            if (me.isElementNode(node)) {
                // 编译节点的指令属性
                me.compile(node);
            // 如果是大括号表达式格式的文本节点
            } else if (me.isTextNode(node) && reg.test(text)) {
                // 编译文本节点
                me.compileText(node, RegExp.$1); // 传入的是表达式: msg
            }
            // 如果还有内层的子节点, 通过递归实现所有层次节点的编译
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node) {
        // 得到所有属性节点
        var nodeAttrs = node.attributes,
            me = this;

        // 遍历属性
        [].slice.call(nodeAttrs).forEach(function(attr) {
            // 得到属性名: v-on:click
            var attrName = attr.name;
            // 是否是指令属性
            if (me.isDirective(attrName)) {
                // 得到属性值(表达式): handleClick
                var exp = attr.value;
                // 得到指令名: on:click
                var dir = attrName.substring(2);
                // 事件指令
                if (me.isEventDirective(dir)) {
                    // 解析事件指令
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                // 普通指令
                } else {
                    // 解析一般指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function(node, exp) {

        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function(node) {
        return node.nodeType == 1;
    },

    isTextNode: function(node) {
        return node.nodeType == 3;
    }
};

/*
包含多个解析指令方法的工具对象
 */
var compileUtil = {
    // 对v-text/{{}}
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    // 对v-html
    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    // 对v-model
    model: function(node, vm, exp) {
        // 解析指令, 初始初始化显示
        this.bind(node, vm, exp, 'model');
        // 保存compile对象
        var me = this,
          // 得到表达式所对应的值
            val = this._getVMVal(vm, exp);
        // 给节点绑定input监听(当输入时触发)
        node.addEventListener('input', function(e) {
            // 得到最新的值
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            // 将最新的值赋值给data中对应的属性-->触发数据绑定的流程
            me._setVMVal(vm, exp, newValue);
            // 保存最新的值
            val = newValue;
        });
    },
    // 对v-class
    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    /*
    真正解析指令实现数据绑定的方法
    exp: 表达式  msg
    dir: 指令名  text/html/class/model
     */
    bind: function(node, vm, exp, dir) {
        // 得到更新节点的函数
        var updaterFn = updater[dir + 'Updater'];
        // 调用函数, 更新节点
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        // 创建一个监视对象, 实现更新显示
        new Watcher(vm, exp, function(value, oldValue) {
            // 更新节点
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件指令处理
    eventHandler: function(node, vm, exp, dir) {
        // 得到事件名(类型): click
        var eventType = dir.split(':')[1],
          // 得到事件的回调函数
            fn = vm.$options.methods && vm.$options.methods[exp];
        // 如果都存在, 给当前节点绑定指定事件名和回调函数的DOM事件监听
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);  // 强制绑定了回调函数中的this为vm
        }
    },

    // 得到指定表达式所对应的值
    _getVMVal: function(vm, exp) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

// 包含多个更新节点方法的对象
var updater = {
    // 更新节点的textContent属性: v-text/{{}}
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // 更新节点的innerHTML属性: v-html
    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    // 更新节点的className属性: v-class
    classUpdater: function(node, value, oldValue) {
        var className = node.className;

        if(className) {
          node.className = className + ' ' + value;
        } else {
          node.className = value;
        }
    },
    // 更新节点的value属性: v-model
    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
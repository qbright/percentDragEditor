var percentDragEditor = (function (window, undefined) {

  // var groupItem = "<span class='_pde_text'> ${ITEM}% </span> <div class='_pde_slider'><div class='_pde_slider_inner'></div> </div>"
  var groupItem = "<span class='_pde_text'> ${ITEM}% </span> <div class='_pde_slider ${disableDrag}'> </div>"
  var groupLastItem = "<span class='_pde_text'> ${ITEM}% </span>";

  var _pde = function (el, config) {
    this.init(el, config);
  }

  _pde.prototype = {
    construct: _pde,
    init: function (el, config) {

      if (!el) {
        throw new Error('the el is undefined');
      }

      //TODO disable配置，只有展示，不能拖动
      this.cf = Object.assign({
        group: [20, 25, 30, 25],
        minlimit: 5,
        step: 5,
        minGroup: 4,
        disableDrag: false
      }, config);
      this._el = el;

      this.initDomAndStyle();

      this.initGroup();

    },
    checkConfig: function () { //TODO check config group;
      var g = this.cf.group;

      var sumTemp = 0;
      var sumArrayTemp = [];
      g.forEach(item => {
        sumTemp += item;
        sumArrayTemp.push(sumTemp);
      });

      if (sumTemp !== 100) { // 如果分组加起来不为100;
      }
    },

    initDomAndStyle: function () {
      this._el.classList.add('_percent_drag_editor');

      this.bar = document.createElement('div');
      this.bar.classList.add('_pde_bar');

      this._el.appendChild(this.bar);

      this.barWidth = this.bar.getBoundingClientRect().width;

      this.calcStepWidth();

    },

    calcStepWidth () { //TODO 在 window resize的时候进行处理

      this.stepWidth = parseInt((this.barWidth / 100) * this.cf.step);
    },

    initGroup: function () {
      var tempGroup = document.createDocumentFragment();


      this.cf.group.forEach((item, index) => {
        tempGroup.appendChild(this.createGroup(index, item, index + 1 === this.cf.group.length))
      });

      this.bar.appendChild(tempGroup);

      if (!this.cf.disableDrag) {
        this.bindDragEvent();
      }
    },

    createGroup: function (index, item, isLast) {
      var temp = document.createElement('div');
      temp.setAttribute('data-index', index);
      temp.classList.add('_pde_group')
      temp.style.flexGrow = item;
      var t = groupItem;

      if (isLast) { // 最后一个
        t = groupLastItem;
      }
      temp.innerHTML = new String(t).replace('${ITEM}', item).replace('${disableDrag}', this.cf.disableDrag ? 'disableDrag' : '');
      return temp;

    },

    bindDragEvent: function (onlyRemove) {

      var sliderSet = this._el.querySelectorAll('._pde_slider');

      var dragMove = function (e) {
        var movementX = e.clientX - this.startX;
        this.handlerDrag(movementX);
      }.bind(this);

      var dragUp = function () {
        window.removeEventListener('mousemove', dragMove);
        window.removeEventListener('mouseup', dragUp);
      }.bind(this)

      var mouseMove = function (e) {

        this.startX = e.clientX;

        this.nowDragTarget = e.currentTarget.parentNode;
        this.nowDragIndex = +this.nowDragTarget.dataset.index;

        this.nowDragNextTarget = this._el.querySelector(`[data-index="${this.nowDragIndex + 1}"]`)

        this.nowDragPercent = +e.target.parentNode.style.flexGrow;
        this.nowDragNextPercent = +this.nowDragNextTarget.style.flexGrow;
        window.addEventListener('mousemove', dragMove);
        window.addEventListener('mouseup', dragUp);

      }.bind(this);

      sliderSet.forEach(function (el) {
        el.removeEventListener('mousedown', mouseMove)
      })

      if (onlyRemove) {
        return;
      }

      sliderSet.forEach(function (el) {
        el.addEventListener('mousedown', mouseMove);
      });


    },

    //TODO 最大最小限制
    handlerDrag: function (movementX) {
      var moveRound = Math.round(movementX / this.stepWidth);

      // if (moveRound > 0) {
      //   console.log(this.stepWidth * moveRound, this.stepWidth, moveRound);

      var tempModifyData = moveRound * this.cf.step;

      var t1 = this.nowDragPercent + tempModifyData;
      var t2 = this.nowDragNextPercent - tempModifyData;

      if (t1 < this.cf.minlimit || t2 < this.cf.minlimit) {
        return;
      }

      this.nowDragTarget.style.flexGrow = t1;
      this.nowDragNextTarget.style.flexGrow = t2;

      this.nowDragTarget.querySelector('._pde_text').innerText = `${t1}%`;
      this.nowDragNextTarget.querySelector('._pde_text').innerText = `${t2}%`;

      // } else if (moveRound < 0) {
      //
      // }


      // console.log(this.nowDragIndex, this.stepWidth, movementX, Math.round(movementX / this.stepWidth));
    },
    getGroupVal: function () {
      var groupSet = Array.apply(null, this._el.querySelectorAll('._pde_group'));

      return groupSet.map(function (el) {
        return +el.style.flexGrow
      });

    },

    addGroup: function () {
      var separateGroupValue = this.separateGroup().filter(function (item) {
        return item.d >= 5;
      });

      if (!separateGroupValue.length) {
        return;
      }

      var groups = document.createDocumentFragment();

      separateGroupValue.forEach(function (it, index) {
        var item = it.d;
        var ind = it.i;

        groups.appendChild(this.createGroup(ind, item, index + 1 == separateGroupValue.length));

      }.bind(this));

      var lastGroup = this._el.querySelector('._pde_bar ._pde_group:last-child');

      lastGroup.parentNode.replaceChild(groups, lastGroup);

      if (!this.cf.disableDrag) {
        this.bindDragEvent();
      }

    },
    separateGroup () { //分离最后一个group
      var val = this.getGroupVal();
      var lastGroup = val[val.length - 1];
      var g1 = Math.round(Math.round(lastGroup / 2) / this.cf.step) * this.cf.step;
      var g2 = lastGroup - g1;

      return [{d: g1, i: val.length - 1}, {d: g2, i: val.length}];
    },

    removeGroup: function () {
      var val = this.getGroupVal();

      if (val.length <= this.cf.minGroup) {
        return;
      }

      var lastGroupVal = [val[val.length - 2] + val[val.length - 1]];

      var lastGroupEl = this.createGroup(val.length - 2, lastGroupVal, true);

      var r1 = this._el.querySelector('._pde_bar ._pde_group:last-child');
      r1.parentNode.removeChild(r1);

      var r2 = this._el.querySelector('._pde_bar ._pde_group:nth-last-child(1)');
      r2.parentNode.removeChild(r2);

      this._el.querySelector('._pde_bar').appendChild(lastGroupEl);

    },
    resetGroup: function (group) {
      this.cf.group = group || [];
      this.resetAll();

      this.initDomAndStyle();
      this.initGroup();

    },

    resetAll: function () {
      this.bindDragEvent(true);

      this._el.innerHTML = "";

    }

  }


  return _pde;
})(window, undefined);
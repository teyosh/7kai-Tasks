"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.gantt = {
    start: null,
    max_days: 33
};

var app = ns.app;

app.data.gantt_taskli_map = {};

app.addEvents('initGanttchart');
app.addEvents('selectDay');

app.addListener('initGanttchart', function(start){
    app.data.gantt.start = new Date(
        start.getFullYear(), start.getMonth(), start.getDate());
});

app.setup.ganttchartSheet = function(ele){
    var blank = '<div class="month"><h1>&nbsp;</h1><div class="days clearfix">'
              + '<div class="day firstday"><h2>&nbsp;</h2></div></div></div>';
    var now   = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day_array = [];
    var createMonth = function(date, width){
        var label = width > 3
                  ? $('<h1/>').text(app.MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear())
                  : width > 0
                  ? $('<h1/>').text(app.MONTH_NAMES_SHORT[date.getMonth()])
                  : $('<h1/>').html('&nbsp;')
        return $('<div class="month"></div>').append(label);
    };

    app.addListener('initGanttchart', function(start){
        ele.html(blank);
        day_array = [];
        var date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        var days = $('<div class="days clearfix"></div>');
        var width =
            (new Date(start.getFullYear(), start.getMonth() + 1, 0)).getDate()
            - start.getDate();
        createMonth.call(app, date, width).append(days).appendTo(ele);
        for (var i = 0, max_i = app.data.gantt.max_days; i < max_i; i++) {
            if (i > 0 && date.getDate() === 1) {
                days = $('<div class="days clearfix"></div>');
                createMonth.call(app, date, max_i - i).append(days).appendTo(ele);
            }
            var day = $('<div class="day"><h2>' + date.getDate() + '</h2></div>');
            day.appendTo(days);
            if (i === 0 || date.getDate() === 1) {
                day.addClass('firstday');
            }
            if (today.getTime() === date.getTime()) {
                day.addClass('today');
            } else if (date.getDay() === 0 || date.getDay() === 6) {
                day.addClass('holiday');
            }
            var holiday = app.date.is_holiday(date);
            if (holiday) {
                day.addClass('holiday');
                var h2 = day.find('h2');
                h2.data('text-ja', app.date.is_holiday(date));
                app.setup.tooltip(h2);
            }
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            day_array.push(day);
        }
        ele.append($(blank));
    });

    app.addListener('receiveSign', function(){
        app.fireEvent('initGanttchart',
            new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    });

    app.addListener('selectDay', function(e){
        for (var i = 0, max_i = day_array.length; i < max_i; i++) {
            var day = day_array[i];
            var lx = day.offset().left;
            var rx = lx + 23;
            if (e.pageX > lx &&
                e.pageX < rx) {
                day.addClass('hover');
            } else {
                day.removeClass('hover');
            }
        }
    });
}
app.setup.ganttchartListsV3 = function(ul){
    var listli_map = {};
    var taskli_map = app.data.gantt_taskli_map;
    var list_template = ul.html();
    var task_template = ul.find('> li > ul').html();
    ul.empty();

    var current_task;

    var listli_toggle = function(li){
        var id = li.data('id');
        var tag = app.data.current_tag;
        if (app.data.current_filter) {
            li.toggle(Boolean(li.data('has-visible-tasks')));
        } else if (tag) {
            li.toggle(Boolean((id in app.data.state.tags) && (tag === app.data.state.tags[id])));
        } else {
            li.show();
        }
    };

    var collapseList = function(li, collapse, effect){
        var folder = li.find('.icon-folder-open, .icon-folder-close');
        if (collapse) {
            folder.data('closed', true);
            folder.removeClass('icon-folder-open').addClass('icon-folder-close');
            if (effect) {
                li.find('> ul.tasks').slideUp('fast', function(){ li.addClass('task-collapse') });
            } else {
                li.find('> ul.tasks').hide();
                li.addClass('task-collapse');
            }

        } else {
            folder.data('closed', false);
            folder.removeClass('icon-folder-close').addClass('icon-folder-open');
            li.removeClass('task-collapse');
            if (effect) {
                li.find('> ul.tasks').slideDown('fast');
            } else {
                li.find('> ul.tasks').show();
            }
        }
    };

    app.addListener('toggleTag', function(tag){
        ul.children().each(function(i, element){
            listli_toggle($(element));
        });
        if (ul.is(':visible')
            && current_task
            && !taskli_map[current_task.id].is(':visible')) {
            app.fireEvent('missingTask');
        }
    });

    app.addListener('checkTag', function(list, tag, active){
        var li = listli_map[list.id];
        if (active) {
            li.attr('data-tag', tag);
        } else {
            li.removeAttr('data-tag');
        }
        li.toggle(Boolean(
            (list.id in app.data.state.tags) &&
            (app.data.current_tag === app.data.state.tags[list.id])
        ));
    });

    app.addListener('resetTag', function(){
        ul.children().each(function(i, element){ listli_toggle($(element)) });
    });

    app.addListener('registerList', function(list){
        var li = $(list_template);
        li.data('id', list.id);
        li.find('> div .name').text(list.name);
        li.find('> ul').empty();
        app.dom.setup(li);

        if (list.id in app.data.state.tags) {
            li.attr('data-tag', app.data.state.tags[list.id]);
        }
        var folder = li.find('.icon-folder-open');
        if ("collapse" in app.data.state && list.id in app.data.state.collapse) {
            collapseList(li, true, false);
        }
        folder.click(function(){
            var folder = $(this);
            if (folder.data('closed')) {
                app.fireEvent('collapseList', list, false);
            } else {
                app.fireEvent('collapseList', list, true);
            }
        });
        li.find('.ui-edit').click(function(e){
            app.fireEvent('editTask', current_task);
        });
        li.find('.ui-sub').click(function(e){
            app.fireEvent('createSubTask', current_task);
        });

        if (list.id in listli_map) {
            li.find('> ul').append(listli_map[list.id].find('> ul').children());
            li.css('display', listli_map[list.id].css('display'));
            listli_map[list.id].after(li);
            listli_map[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        listli_map[list.id] = li;
    });

    app.addListener('collapseList', function(list, collapse){
        var li = listli_map[list.id];
        if (li) {
            collapseList(li, collapse, false);
        }
    });

    app.addListener('deleteList', function(list){
        listli_map[list.id].remove();
        delete listli_map[list.id];
    });

    app.addListener('clear', function(){
        ul.empty();
        app.data.gantt_listli_map = listli_map = {};
    });

    // ---

    var set_due = function(bar, task, due){
        var days = app.date.relativeDays(due, app.data.gantt.start);
        if (task.duration > 1) {
            days = days - task.duration + 1;
        }
        if (days > app.data.gantt.max_days) {
            bar.css('left', ((app.data.gantt.max_days + 1) * 23) + 'px');
            bar.find('.back, .handle').show();
            bar.addClass('draggable');
        } else if (days > -1) {
            bar.css('left', ((days + 1) * 23) + 'px');
            bar.find('.back, .handle').show();
            bar.addClass('draggable');
        } else {
            bar.css('left', '0px');
            bar.find('.back, .handle').hide();
            bar.removeClass('draggable');
        }
    };

    var set_duration = function(bar, task, duration){
        if (duration > 1) {
            bar.find('.back').css('width', (duration * 23) - 10 + 'px');
        } else {
            bar.find('.back').css('width', '12px');
        }
    };

    app.addListener('registerTask', function(task){
        var ul = listli_map[task.list.id].find('> ul:first');
        var li = $(task_template);
        li.data('id', task.id);

        app.dom.setup(li, task);

        if (task.closed) {
            li.addClass('closed');
        }
        if (task.pending) {
            li.addClass('pending');
        }

        var dragmode = false;
        if (task.due) {
            var bar = li.find('.due');
            var back = $('<div class="back"></div>')
            var handle = $('<div class="handle"></div>');
            var body = $('body');
            bar.prepend(back.append(handle));
            set_due(bar, task, task.due_date);
            set_duration(bar, task, task.duration);
            handle.mousedown(function(e){
                e.preventDefault();
                e.stopPropagation();
                dragmode  = true;
                var x     = back.offset().left + back.width();
                var diff  = 0;
                var min   = 1 + ( task.duration || 1 ) * -1;
                var max   = app.data.gantt.max_days - app.date.relativeDays(task.due_date, app.data.gantt.start) - 1;
                body.addClass('resize');
                $(d).off('mousemove.gantt-handle');
                $(d).on('mousemove.gantt-handle', function(e){
                    e.preventDefault();
                    var move = e.pageX > x ? parseInt((e.pageX - x + 12) / 23) : Math.ceil((e.pageX - x) / 23);
                    if (move === diff) {
                        return;
                    }
                    if (move > max) {
                        return;
                    }
                    diff = move > min ? move : min;
                    set_duration(bar, task, ( task.duration || 1 ) + diff);
                });
                $(d).off('mouseup.gantt-handle');
                $(d).on('mouseup.gantt-handle', function(e){
                    e.preventDefault();
                    body.removeClass('resize');
                    $(d).off('mousemove.gantt-handle');
                    $(d).off('mouseup.gantt-handle');
                    if (diff) {
                        app.api.task.update({
                            list_id: task.list.id,
                            task_id: task.id,
                            due: app.date.mdy(
                                new Date(
                                    task.due_date.getFullYear()
                                    , task.due_date.getMonth()
                                    , task.due_date.getDate() + diff
                                )
                            ),
                            duration: ( task.duration || 1 ) + diff
                        });
                    }
                    dragmode = false;
                });
            });
            bar.mousedown(function(e){
                e.preventDefault();
                e.stopPropagation();
                if (! bar.hasClass('draggable')) {
                    return;
                }
                dragmode  = true;
                var x     = e.pageX;
                var diff  = 0;
                var days  = app.date.relativeDays(task.due_date, app.data.gantt.start);
                body.addClass('move');
                $(d).off('mousemove.gantt-handle');
                $(d).on('mousemove.gantt-handle', function(e){
                    e.preventDefault();
                    var move = e.pageX > x ? parseInt((e.pageX - x) / 23) : Math.ceil((e.pageX - x) / 23);
                    if (move === diff) {
                        return;
                    }
                    if ((days + move) < 1) {
                        return;
                    }
                    if ((days + move) > app.data.gantt.max_days) {
                        return;
                    }
                    diff = move;
                    set_due(bar, task, new Date(
                        task.due_date.getFullYear()
                        , task.due_date.getMonth()
                        , task.due_date.getDate() + diff
                    ));
                });
                $(d).off('mouseup.gantt-handle');
                $(d).on('mouseup.gantt-handle', function(e){
                    e.preventDefault();
                    body.removeClass('move');
                    $(d).off('mousemove.gantt-handle');
                    $(d).off('mouseup.gantt-handle');
                    if (diff) {
                        app.api.task.update({
                            list_id: task.list.id,
                            task_id: task.id,
                            due: app.date.mdy(
                                new Date(
                                    task.due_date.getFullYear()
                                    , task.due_date.getMonth()
                                    , task.due_date.getDate() + diff
                                )
                            )
                        });
                    }
                    dragmode = false;
                });
            });
        }
        li.mousemove(function(e){
            if (dragmode) {
                return;
            }
            app.fireEvent('selectDay', e);
        });
        li.click(function(e){
            e.preventDefault();
            e.stopPropagation();
            if (e.target &&
                e.target.tagName === 'IMG') {
                return;
            }
            var due = '';
            var x = e.offsetX - 240 + 2;
            if (x > 23) {
                var diff = parseInt(x / 23, 10);
                if (task.duration) {
                    diff = diff + task.duration - 1;
                }
                due = app.date.mdy(
                    new Date(
                        app.data.gantt.start.getFullYear()
                        , app.data.gantt.start.getMonth()
                        , app.data.gantt.start.getDate() + diff - 1
                    )
                );
            }
            if (x > 0) {
                app.api.task.update({
                    list_id: task.list.id,
                    task_id: task.id,
                    due: due
                });
            } else {
                app.fireEvent('openTask', task);
            }
        });
        li.dblclick(function(e){
            e.stopPropagation();
            app.fireEvent('editTask', task);
        });
        if (task.id in taskli_map) {
            var li_before = taskli_map[task.id];
            if (!li_before.data('visible')) {
                li.data('visible', false);
                li.hide();
            } else {
                li.data('visible', true);
            }
            if (li_before.hasClass('selected')) {
                li.addClass('selected');
            }

            // 置き換え元との高さ合わせ
            var paddingLeft = parseInt(li_before.css('paddingLeft'), 10);
            if (paddingLeft) {
                li.css('paddingLeft', paddingLeft + 'px');
            } else {
                li.css('paddingLeft', '0px');
            }

            // 置き換え
            if (task.before &&
                task.before.list.id !== task.list.id) {
                ul.append(li);
            } else {
                li_before.after(li);
            }
            li_before.remove();
            if (app.util.taskFilter(task, app.data.current_filter)) {
                li.data('visible', true);
                app.dom.slideDown(li);
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (!app.util.taskFilter(child, app.data.current_filter)) {
                            return;
                        }
                        if (!taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', true);
                            app.dom.slideDown(taskli_map[child.id]);
                        }
                    }
                });
            } else {
                li.data('visible', false);
                app.dom.slideUp(li);
                app.util.findChildTasks(task, function(child){
                    if (child.id && taskli_map[child.id]) {
                        if (app.util.taskFilter(child, app.data.current_filter)) {
                            return;
                        }
                        if (taskli_map[child.id].data('visible')) {
                            taskli_map[child.id].data('visible', false);
                            app.dom.slideUp(taskli_map[child.id]);
                        }
                    }
                });
                if (li.hasClass('selected')) {
                    var next = li.nextAll(':visible:first');
                    if (!next.length) {
                        next = li.prevAll(':visible:first');
                    }
                    if (next.length) {
                        app.fireEvent('openTask', app.data.task_map[next.data('id')]);
                    } else {
                        app.fireEvent('missingTask');
                    }
                }
            }
            taskli_map[task.id] = li;
        } else {
            li.css('left', '0px');
            li.hide();
            taskli_map[task.id] = li;
            if (task.parent_id in taskli_map) {
                taskli_map[task.parent_id].after(li);
                var paddingLeft = parseInt(taskli_map[task.parent_id].css('paddingLeft'), 10);
                li.css('paddingLeft', (paddingLeft + 18) + 'px');
            } else {
                li.css('paddingLeft', '0px');
                li.prependTo(ul);
            }
            if (app.util.taskFilter(task, app.data.current_filter)) {
                li.data('visible', true);
                app.dom.slideDown(li);
            }
        }
    });

    app.addListener('openTask', function(task, forceTop){
        if (!ul.is(':visible')) { return }
        ul.find('> li > ul > li').removeClass('selected');
        ul.find('.ui-edit, .ui-sub').attr('disabled', true);
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
            taskli_map[task.id].parent().parent()
                .find('.ui-edit, .ui-sub').attr('disabled', false);
                app.dom.scrollTopFix(ul.parent(), taskli_map[task.id], forceTop);
        }
        current_task = task;
    });

    app.addListener('selectTab', function(group, id){
        if (group === 'viewer' && id === 'gantt') {
            var hash = w.location.hash;
            if (hash) {
                var str = hash.match(/^#(\d+)-(\d+:\d+)$/);
                if (str) {
                    var task = app.data.task_map[str[2]];
                    if (task) {
                        app.fireEvent('openTask', task);
                    }
                }
            }
        }
    });

    app.addListener('openNextTask', function(skip){
        var next;
        if (current_task) {
            if (!skip) {
                next = taskli_map[current_task.id].nextAll(':visible:first');
            }
            if (!next || !next.length) {
                listli_map[current_task.list.id]
                    .nextAll(':visible')
                    .each(function(i, li){
                        next = $(li).find('> ul > li:visible:first');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:first');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id], skip);
        }
    });

    app.addListener('openPrevTask', function(skip){
        var next;
        if (current_task) {
            if (!skip) {
                next = taskli_map[current_task.id].prevAll(':visible:first');
            }
            if (!next || !next.length) {
                listli_map[current_task.list.id]
                    .prevAll(':visible')
                    .each(function(i, li){
                        next = skip
                             ? $(li).find('> ul > li:visible:first')
                             : $(li).find('> ul > li:visible:last');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:last');
            if (next && next.length && skip) {
                var top = next.prevAll(':visible:last');
                if (top) {
                    next = top;
                }
            }
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id], skip);
        }
    });

    app.addListener('sortTask', function(tasks, column, reverse){
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            var ul = listli_map[tasks[i].list.id].find('> ul:first');
            ul.append(taskli_map[tasks[i].id]);
            var parents = app.util.findParentTasks(tasks[i]);
            if (parents.length) {
                taskli_map[tasks[i].id].css('paddingLeft', ((parents.length * 18) + 0) + 'px');
            } else {
                taskli_map[tasks[i].id].css('paddingLeft', '0px');
            }
        }
    });

    app.addListener('filterTask', function(condition){
        if (!ul.is(':visible')) {
            return;
        }
        var hasVisible = {};
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                hasVisible[task.list.id] = true;
                li.show();
                if (!li.data('visible')) {
                    li.data('visible', true);
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.hide();
                }
            }
        }
        ul.children().each(function(){
            var li = $(this);
            li.data('has-visible-tasks', Boolean(li.data('id') in hasVisible));
            listli_toggle(li);
        });
    });

    app.addListener('initGanttchart', function(start){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (task.duration) {
                set_duration(li.find('.due'), task, task.duration);
            }
            if (task.due) {
                set_due(li.find('.due'), task, task.due_date);
            }
        }
    });

    app.addListener('openNextList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openNextTask', true);
    });

    app.addListener('openPrevList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openPrevTask', true);
    });

    app.addListener('clearList', function(list){
        var is_remove = function(task){
            if (list.id !== task.list.id) {
                return false;
            }
            if (task.closed) {
                return true;
            }
            if (task.parent_id) {
                var parent = app.data.task_map[task.parent_id];
                if (!parent || parent.closed) {
                    return true;
                }
            }
            return false;
        };
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var parentTask = app.util.findParentTask(task);
            if (is_remove(task)) {
                if (task_id in taskli_map) {
                    taskli_map[task_id].remove();
                    delete taskli_map[task_id];
                }
                delete taskli_map[task_id];
            }
        }
    });

    app.addListener('missingTask', function(){
        if (!ul.is(':visible')) { return }
        current_task = null;
    });

    app.addListener('checkStar', function(on, task){
        var li = taskli_map[task.id];
        var i = li.find('.icon-star');
        if (on) {
            i.removeClass('icon-gray');
        } else {
            i.addClass('icon-gray');
        }
    });

    app.addListener('selectTab', function(group, id){
        if (group === 'viewer' && id === 'gantt') {
            app.fireEvent('filterTask', app.data.current_filter);
        }
    });

    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (app.state.tab.viewer !== 'gantt') {
            return;
        }
        e.preventDefault();
        var task = current_task ? app.data.task_map[current_task.id] : null;
        if (e.shiftKey) {
            if (e.keyCode === 38 || e.keyCode === 75) { // Up
                app.fireEvent('openPrevList');
            } else if (e.keyCode === 40 || e.keyCode === 72) { // Down
                app.fireEvent('openNextList');
            } else if (e.keyCode === 78) {
                if (task) {
                    app.fireEvent('createSubTask', task);
                }
            }
            return;
        }
        if (e.keyCode === 38 || e.keyCode === 75) { // Up / J
            app.fireEvent('openPrevTask');
        } else if (e.keyCode === 40 || e.keyCode === 74) { // Down / K
            app.fireEvent('openNextTask');
        }
        if (e.keyCode === 78) { // N
            var list = task
                     ? task.list
                     : app.data.list_map[ul.find('> li:first').data('id')];
            app.fireEvent('createTask', list);
        }
        if (!current_task || !(current_task.id in app.data.task_map)) {
            return;
        }
        var task = app.data.task_map[current_task.id];
        if (e.keyCode === 37 || e.keyCode === 72) { // Left / H
            var today = new Date();
            var due;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                due = app.date.mdy(new Date(task.due_date.getTime() - (24 * 60 * 60 * 1000)));
            } else {
                due = '';
            }
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                due: due
            });
        } else if (e.keyCode === 39 || e.keyCode === 76) { // Right / L
            var today = new Date();
            var date;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                date = new Date(task.due_date.getTime() + (24 * 60 * 60 * 1000));
            } else {
                date = new Date(today.getTime() + (24 * 60 * 60 * 1000));
            }
            var due = app.date.mdy(date);
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                due: due
            });
        } else if (e.keyCode === 32) { // Space
            var status = task.status >= 2 ? 0 : task.status + 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                status: status
            });
        } else if (e.keyCode === 59 || e.keyCode === 186) { // :;*
            var method = 'on';
            if (task.id in app.data.state.star) {
                method = 'off';
                delete app.data.state.star[task.id];
            } else {
                app.data.state.star[task.id] = 1;
            }
            app.api.account.update({
                ns: 'state',
                method: method,
                key: 'star',
                val: task.id
            });
            app.fireEvent('checkStar', method === 'on', task);
        } else if (e.keyCode === 80) { // P
            var pending = task.pending ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                pending: pending
            });
        } else if (e.keyCode === 69) { // E
            app.fireEvent('editTask', task);
        } else if (e.keyCode === 13) { // Enter
            var closed = task.closed ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                closed: closed
            });
        }
    });
}
app.setup.nextWeek = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.fireEvent('initGanttchart',
            new Date(
                app.data.gantt.start.getFullYear(),
                app.data.gantt.start.getMonth(),
                app.data.gantt.start.getDate() + 7));
    });
    app.dom.disableSelection(ele);
}
app.setup.prevWeek = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.fireEvent('initGanttchart',
            new Date(
                app.data.gantt.start.getFullYear(),
                app.data.gantt.start.getMonth(),
                app.data.gantt.start.getDate() - 7));
    });
    app.dom.disableSelection(ele);
}

})(this, window, document, jQuery);
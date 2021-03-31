class DomNode {
    compileToNode(domString) {
        const div = document.createElement("div");
        div.innerHTML = domString;
        return div.firstElementChild;
    }
}

class MainPage extends DomNode {
    constructor() {
        super();
        this.board = new Board()
        this.taskForm = new TaskForm(this.board);
        this.aside = new Aside(this.taskForm, this.board);
        this.darkTheme = new DarkTheme();

        this.aside.toggler.addEventListener('click', () => {
            this.aside.toggler.classList.contains('active') ? this.aside.remove() : this.aside.show();
        });
        this.darkTheme.toggler.addEventListener('click', () => {
            this.darkTheme.toggler.classList.contains('active') ? this.darkTheme.off() : this.darkTheme.on();
        });

        if (localStorage.getItem('dark-mode') === 'true') this.darkTheme.on();
    }
}

class DarkTheme {
    constructor() {
        this.toggler = document.getElementById('themeToggler')

        this.darkThemeTag = document.createElement('link')
        this.darkThemeTag.setAttribute('rel', 'stylesheet')
        this.darkThemeTag.setAttribute('href', 'assets/styles/dark-theme.css')
        this.darkThemeTag.setAttribute('id', 'dark-theme')

        this.head = document.head
    }

    on() {
        this.head.appendChild(this.darkThemeTag);
        this.toggler.classList.add('active');
        localStorage.setItem('dark-mode', 'true');
    }

    off() {
        this.head.removeChild(this.darkThemeTag);
        this.toggler.classList.remove('active');
        localStorage.removeItem('dark-mode');
    }
}

class Aside extends DomNode {
    constructor(taskForm, board) {
        super();
        this.board = board;
        this.template = `    
    <aside>
        <div class="buttons-top">
            <button class="button-reset"><i class="fas fa-search white-icon"></i></button>
            <button class="button-reset" id="addTask"><i class="fas fa-plus white-icon"></i></button>
        </div>
        <img class="avatar" src="https://avatarfiles.alphacoders.com/226/thumb-1920-226760.jpg" alt="user avatar">
    </aside>`.trim();
        this.aside = this.compileToNode(this.template);
        this.page = document.querySelector('.container');
        this.addTaskButton = this.aside.querySelector("#addTask");

        this.taskForm = taskForm;

        this.toggler = document.getElementById('optionsToggler');
        this.toggler.disabled = true;
    }

    remove() {
        this.toggler.disabled = true;
        this.toggler.classList.remove('active');

        this.board.node.animate([
            {marginLeft: '3rem'},
            {marginLeft: '0'}
        ], {duration: 500, easing: 'ease-out'}).onfinish = () => {
            this.board.node.style.marginLeft = '0'
        };

        this.aside.animate([
            {marginLeft: '0'},
            {marginLeft: '-3rem'}
        ], {duration: 500, easing: 'ease-out'}).onfinish = () => {
            this.aside.remove();
            this.toggler.disabled = false;
        }

        this.addTaskButton.removeEventListener("click", this.taskForm.show.bind(this.taskForm));
    }

    show() {
        this.addTaskButton.addEventListener("click", this.taskForm.show.bind(this.taskForm));
        this.toggler.disabled = true;
        this.toggler.classList.add('active');
        this.board.node.animate([
            {marginLeft: "0"},
            {marginLeft: '3rem'}
        ], {duration: 500, easing: "ease-out"}).onfinish = () => {
            this.board.node.style.marginLeft = '3rem';
        };

        this.aside.animate([
            {marginLeft: '-3rem'},
            {marginLeft: '0'}
        ], {duration: 500, easing: "ease-out"}).onfinish = () => {
            this.toggler.disabled = false;
        }
        this.page.prepend(this.aside);
    }
}

class TaskForm extends DomNode {
    constructor(board, aside) {
        super();
        this.board = board;
        this.template = `
<div class="modal">
    <div class="modal-content">
        <div class="modal-guts">
            <div class="overflow">
                <h3>Add a new task</h3>
                <button class="button-reset" id="closeAddTaskForm"><i class="fas fa-times"></i></button>
                <form id="addTaskForm" action="" method="POST">
                <label for="title">Title</label>
                <input autocomplete="off" type="text" name="title" id="title" required>
                
                <label for="type">Type</label>
                <select name="type" id="type" required>
                    <option disabled selected value></option>
                    <option value="task">Task</option>
                    <option value="improvement">Improvement</option>
                    <option value="bug">Bug</option>
                </select>
                
                <label for="priority">Priority</label>
                <select name="priority" id="priority" required>
                    <option disabled selected value></option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                
                <label for="column">Column</label>
                <select name="column" id="column" required>
                    <option disabled selected value></option>
                    {column-options}
                </select>
                <button class="button-reset btn btn-primary" name="submit" type="submit">Add task</button>
            </form>      
            </div>
        </div>
    </div>
</div>
  `.trim();
        this.container = document.querySelector('.container');
    }

    show() {
        this.form = this.compileTemplate();
        this.closeButton = this.form.querySelector("#closeAddTaskForm");
        const addTaskButton = document.querySelector("#addTask");
        addTaskButton.disabled = true;

        document.body.appendChild(this.form)
        this.container.style.overflow = 'hidden';
        this.form.animate([
            {opacity: 0},
            {opacity: 1}
        ], 500).onfinish = () => {
            this.form.addEventListener('click', this.close.bind(this));
            this.closeButton.addEventListener('click', this.close.bind(this));
            this.form.addEventListener('submit', this.submitTask.bind(this));
        };
    }

    compileTemplate() {
        const columnOptions = this.getColumnOptions();
        const compiledTemplate = this.template
            .replace("{column-options}", columnOptions)
            .replace("{name}", this.name);
        return this.compileToNode(compiledTemplate);
    }

    getColumnOptions() {
        return this.board.columns.reduce((previousValue, currentValue) => {
            const option = '<option value="{id}">{name}</option>'
                .replace('{id}', currentValue.id)
                .replace('{name}', currentValue.name);
            return previousValue.concat(option);
        }, "")
    }

    submitTask(event) {
        event.preventDefault();

        const {target} = event;
        const title = target.querySelector('[name="title"]').value;
        const type = target.querySelector('[name="type"]').value;
        const priority = target.querySelector('[name="priority"]').value;
        const columnId = target.querySelector('[name="column"]').value;

        const column = this.board.getColumnById(columnId);

        const task = new Task(title, type, priority, column);
        column.addTask(task);

        this.close(event);
    }

    close(event) {
        if (event.target.parentNode === this.closeButton
            || event.target === this.form
            || event.type === "submit") {

            this.form.removeEventListener('submit', this.submitTask.bind(this));
            this.closeButton.removeEventListener('click', this.close.bind(this));
            this.form.removeEventListener('click', this.close.bind(this));

            this.container.style.overflow = 'auto';
            this.form.animate([
                {opacity: 1},
                {opacity: 0}
            ], 500).onfinish = () => {
                this.form.remove();
                const addTaskButton = document.querySelector("#addTask");
                addTaskButton.disabled = false;
            }
        }
    }
}

class Board extends DomNode {
    constructor() {
        super();
        this.columns = [];
        this.users = [];
        this.template = `    
    <main class="board">
        <h1 class="primary-header">{name}</h1>
        <div class="below-header">
            <div class="input-box">
                <input autocomplete="off" type="text">
                <i class="fas fa-search white-icon"></i>
            </div>
            <div class="users">
            {user-avatars}
            </div>

            <button class="button-reset">Only My Issues</button>
        </div>
        
        <div class="container board" id="board">
            <section class="column" id="add-column">Add a column...</section>
        </div>

    </main>`.trim();
        fakeFetch.then((data) => {
            return JSON.parse(data);
        })
            .then((data) => {
                const board = data.board;
                Object.keys(board)
                    .filter(attribute => {return attribute !== "columns" && attribute !== 'users'} )
                    .forEach((attribute)=> this[attribute]=board[attribute]);

                this.users = board.users;
                this.node = this.compileTemplate();

                return board.columns;
            })
            .then((columns) => {
                columns.forEach((column) => {
                    const name = column.name;
                    const newColumn = new TaskColumn(name, this);
                    this.addColumn(newColumn);

                    column.tasks.forEach((task) => {
                        const priority = task.priority;
                        const title = task.title;
                        const type = task.type;

                        const newTask = new Task(title, type, priority, newColumn);
                        newColumn.addTask(newTask);
                    })

                    document.getElementById('optionsToggler').disabled = false;
                })
            })
            .then(() => this.show())
    }

    show() {
        const container = document.querySelector('.container');
        container.prepend(this.node);
    }

    compileTemplate() {
        const compiledTemplate = this.template
            .replace("{name}", this.name)
            .replace('{user-avatars}', this.getUsersPhotos())
        return this.compileToNode(compiledTemplate);
    }

    getUsersPhotos() {
        return this.users.reduce((previousValue, currentValue) => {
            const photos = '<img class="avatar avatar-m" src="{photo-url}" alt="{username}">'
                .replace('{photo-url}', currentValue.photoUrl)
                .replace('{username}', currentValue.username);
            return previousValue.concat(photos);
        }, "")
    }

    addColumn(column) {
        this.columns.push(column);
        column.show();
    }

    getColumnById(id) {
        let result
        this.columns.forEach((column) => {
            if(column.id === id) result=column;
        });
        return result;
    }
}

class TaskColumn extends DomNode {
    constructor(name, board) {
        super();
        this.board = board;
        this.template = `
            <section id="{id}" class="column">
                <h2 class="secondary-header column-header">{name}</h2>
                <div class="tasks-list"></div>
            </section>`.trim();
        this.name = name;
        this.id = name.replaceAll(" ", "-");
        this.tasks = [];
        this.node = this.compileTemplate()
        this.addColumnNode = this.board.node.querySelector('#add-column');
    }

    compileTemplate() {
        const compiledTemplate = this.template
            .replace("{id}", this.id)
            .replace("{name}", this.name);
        return this.compileToNode(compiledTemplate);
    }

    show() {
        const board = this.board.node.querySelector('#board');
        board.insertBefore(this.node, this.addColumnNode);
    }

    addTask(task) {
        this.tasks.push(task);
        task.show();
    }

    remove() {

    }
}

class Task extends DomNode {
    taskTypeIcons = {
        'task': 'fa-bookmark blue-icon',
        'improvement': 'fa-chart-line green-icon',
        'bug': 'fa-bug red-icon'
    };

    taskPriorityIcons = {
        'low': 'blue-icon',
        'medium': 'green-icon',
        'high': 'orange-icon',
        'urgent': 'red-icon',
    }

    constructor(title, type, priority, column) {
        super()
        this.template = `
        <article class="task" draggable="true">
        <button class="button-reset removeTaskButton"><i class="fas fa-trash-alt"></i></button>
        <h3 class="task-title">{title}</h3>
        <div class="task-details">
            <div class="users">
                <img class="avatar" src="https://avatarfiles.alphacoders.com/226/thumb-1920-226760.jpg" alt="user avatar">
                <img class="avatar" src="https://avatarfiles.alphacoders.com/226/thumb-1920-226760.jpg" alt="user avatar">
            </div>
            <span class="tag">{type}</span>
            <i class="fas {task-type-icon} fa-2x margin-right-s"></i>
            <i class="fas  fa-arrow-circle-up {task-priority-color} fa-2x"></i>
        </div>
    </article>
`.trim();
        this.column = column;
        this.title = title;
        this.type = type;
        this.priority = priority;
        this.node = this.compileTemplate();

        this.node.addEventListener('dragstart', this.dragStart.bind(this));
        document.addEventListener('dragenter', this.dragEnter);
        document.addEventListener('dragover', function(event) {
            event.preventDefault();
        });
        document.addEventListener('drop', this.dropEnd);
    }

    compileTemplate() {
        const compiledTemplate = this.template
            .replace("{title}", this.title)
            .replace("{type}", this.type)
            .replace("{task-type-icon}", this.taskTypeIcons[this.type])
            .replace("{task-priority-color}", this.taskPriorityIcons[this.priority]);
        return this.compileToNode(compiledTemplate);
    }

    show() {
        const tasksList = this.column.node.querySelector(".tasks-list");
        const removeTaskButton = this.node.querySelector('.removeTaskButton')

        tasksList.appendChild(this.node);
        removeTaskButton.addEventListener('click', this.remove.bind(this), {once: true})
    }

    remove() {
        const taskList = this.column.tasks
        const index = taskList.indexOf(this)
        taskList.splice(index, 1);

        const animation = this.node.animate([
                {opacity: 1},
                {opacity: 0}
            ], 500
        );
        animation.onfinish = this.node.remove.bind(this.node);
    }

    dragStart(event) {
        window.taskDragged = this.node;
        window.initialPositionDragged = {
            parentNode: this.node.parentNode,
            nextSibling: this.node.nextElementSibling
        }

        setTimeout(() => {
            window.taskDragged.style.display = "none";
        }, 0)
    }

    dragEnter(event) {
        event.preventDefault();
        if (event.target.classList.contains('task')) {
            event.target.parentNode.insertBefore( window.taskDragged, event.target.nextSibling);
            window.taskDragged.style.display = "block";
            window.taskDragged.style.visibility = "hidden";
        } else if(event.target.classList.contains("column-header")) {
            event.target.nextElementSibling.prepend( window.taskDragged)
            window.taskDragged.style.display = "block";
            window.taskDragged.style.visibility = "hidden";
        } else if(event.target.classList.contains('board')) {
            setTimeout(() => {
                window.taskDragged.style.display = "none"
            }, 0)
        }
    }

    dropEnd(event) {
        if(window.taskDragged) {
            event.preventDefault();
            if(window.taskDragged.style.display === "none") {
                window.taskDragged.style.display = "block";
                window.initialPositionDragged.parentNode.insertBefore(window.taskDragged, window.initialPositionDragged.nextSibling)
            }
            window.taskDragged.style.visibility = 'visible';
            window.taskDragged = null;
        }
    }
}


const board = {
    "board": {
        'id': "1",
        'name': "Primul meu kanban board",
        'users': [
            {
                'id': 1,
                'username': "alexfrunza",
                'photoUrl': "https://avatarfiles.alphacoders.com/693/69306.jpg"
            },
            {
                'id': 2,
                'username': "alex",
                'photoUrl': "https://avatarfiles.alphacoders.com/654/65454.png"
            },
            {
                'id': 3,
                'username': "alex123",
                'photoUrl': "https://avatarfiles.alphacoders.com/233/233054.jpg"
            }
        ],
        'columns': [
            {
                id: "1",
                name: "Backlog",
                tasks: [
                    {
                        id: "1",
                        title: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi, quaerat!",
                        type: "task",
                        priority: "medium",
                        column: "backlog"
                    },
                    {
                        id: "2",
                        title: "Lorem ipsum dolor sit amet.",
                        type: "improvement",
                        priority: "urgent",
                        column: "backlog",
                    }
                ]
            },
            {
                id: "2",
                name: "Selected for Development",
                tasks: [
                    {
                        id: "3",
                        title: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi, quaerat!",
                        type: "bug",
                        priority: "low",
                        column: "Selected for Development",
                    },
                ]
            },
            {
                id: "3",
                name: "In progress",
                tasks: [
                    {
                        id: "4",
                        title: "Lorem ipsum dolor.",
                        type: "bug",
                        priority: "high",
                        column: "In progress",
                    },
                ]
            },
            {
                id: "4",
                name: "Done",
                tasks: [
                    {
                        id: "5",
                        title: "Lorem ipsum dolor.",
                        type: "bug",
                        priority: "high",
                        column: "In progress",
                    },
                ]
            },
        ]
    }
}
const dataFromServer = JSON.stringify(board)
const fakeFetch = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(dataFromServer);
    }, 1000);
});

const mainPage = new MainPage()
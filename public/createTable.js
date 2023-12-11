

const createTable = async (data) => {
    const keys = Object.keys(data[0]);
    const table = document.createElement('table');
    table.classList = ['mui-table'];
    const thead = table.createTHead();
    const tbody = table.createTBody();
    const makeHeader = async () => {
        const row = document.createElement('tr');
        row.classList = ['course-row']
        keys.forEach(key => {
            const td = document.createElement('th');
            td.innerText = key;
            row.append(td);
        });
        thead.append(row);
    }
    await makeHeader();
    data.forEach(async d => {
        const row = document.createElement('tr');
        row.dataset.id = d._id;
        row.classList = ['course-row']
        for (let key of keys) {
            const td = document.createElement('td');
            td.innerText = d[key];
            row.append(td);
        }
        tbody.append(row);
    });
    return table;
}


const teacherAddButtons = (table) => {
    const thead = table.querySelector('thead');
    const headerRow = thead.querySelector('tr');
    headerRow.append(document.createElement('th'));

    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    for (let row of rows) {
        const td = document.createElement('td');
        const btns = ["Edit", "Delete"].map(name => {
            const btn = document.createElement('button');
            btn.innerText = name;
            btn.classList = ['button modern-button']
            return btn;
        });
        btns[0].onclick = async () => {
            sessionStorage.setItem('teacherId', row.dataset.id)
            window.location.assign(window.location.origin + '/teacherForm');
        }
        btns[1].onclick = async () => {
            alert(row.dataset.id);
            axiosDelete(`./api/teacher/${JSON.stringify(row.dataset.id)}`)
                .then(res => {
                    console.log(res);
                    if (res.status === 200) {
                        alert('Teacher deleted successfully');
                        // Add code to update your UI or handle the deletion in the client-side
                    } else {
                        alert('Failed to delete teacher');
                    }
                })
                .catch(e => {
                    console.error(e);
                    alert('An error occurred while deleting teacher');
                });

            location.reload();
        }
        btns.forEach(btn => td.append(btn));
        row.append(td)
    }
}

const courseAddButtons = (table) => {
    const thead = table.querySelector('thead');
    const headerRow = thead.querySelector('tr');
    headerRow.append(document.createElement('th'));

    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    for (let row of rows) {
        const td = document.createElement('td');
        const btns = ["Edit", "Delete"].map(name => {
            const btn = document.createElement('button');
            btn.innerText = name;
            btn.classList = ['button modern-button']
            return btn;
        });
        btns[0].onclick = async () => {
            sessionStorage.setItem('courseId', row.dataset.id)
            window.location.assign(window.location.origin + '/courseForm');
        }
        btns[1].onclick = async () => {
            try {
                const response = await axiosDelete(`../api/course/${JSON.stringify(row.dataset.id)}`);
                if (response.status === 200) {
                    alert('Course deleted successfully');
                    // Add code to update your UI or handle the deletion in the client-side
                } else {
                    alert('Failed to delete course');
                }
            } catch (error) {
                console.error(error);
                alert('An error occurred while deleting course');
            }
            location.reload();
        };

        btns.forEach(btn => td.append(btn));
        row.append(td)
    }
}
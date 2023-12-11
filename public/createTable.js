

const createTable = async (data) => {
    console.log(data);
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
        for(let key of keys){
            const td = document.createElement('td');
            td.innerText = d[key];
            row.append(td);
        }
        tbody.append(row);
    });
    return table;
}
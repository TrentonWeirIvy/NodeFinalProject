class FormObj {
    constructor(obj) {
        this.action = obj.action ?? '';
        this.lblText = obj.lblText ?? 'Label';
        this.buttonLabel = obj.buttonLabel ?? 'Submit';
    }
}

const createTeacherForm = (obj) => {
    const form = document.createElement('form');
    form.action = obj.action;
    form.method = "POST";
    form.classList.add('card-content', 'modern-form');

    const lbl = document.createElement('label');
    lbl.htmlFor = 'teacherName';
    lbl.classList.add('modern-label');
    lbl.innerText = obj.lblText;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'teacherName';
    input.name = 'courseName';
    input.value = '';
    input.classList.add('custom-input');
    input.required = true;

    const button = document.createElement('button');
    button.type = 'button'; // Change to 'submit' if you want it to submit the form
    button.id = 'submitButton';
    button.classList.add('button', 'modern-button');
    button.innerText = obj.buttonLabel;

    form.appendChild(lbl);
    form.appendChild(input);
    form.appendChild(button);

    return form;
};


document.addEventListener('DOMContentLoaded', function() {
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function performSearch(inputId, listIdOrClass, itemSelector) {
        const input = document.getElementById(inputId);
        const filter = input.value.toUpperCase();
        const list = document.getElementById(listIdOrClass) || document.querySelector('.' + listIdOrClass);
        if (!list) return;
        const items = list.querySelectorAll(itemSelector);
        
        items.forEach(item => {
            const txtValue = item.textContent || item.innerText;
            item.style.display = txtValue.toUpperCase().includes(filter) ? "" : "none";
        });
    }

    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            closeModal(this.closest('.modal'));
        }
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    }

    function searchEmployees() {
        performSearch("searchEmployees", "employeeList", "li");
        performSearch("searchEmployees", "employee-list", ".employee-item");
    }
    
    function searchComputers() {
        performSearch("searchComputers", "computerList", "li");
        performSearch("searchComputers", "computer-list", ".computer-item");
    }

    function searchPannes() {
        performSearch("searchPannes", "panne-list", ".panne-item");
    }

    const searchInputs = [
        { id: 'searchEmployees', listId: 'employeeList', selector: 'li', searchFunction: searchEmployees },
        { id: 'searchComputers', listId: 'computerList', selector: 'li', searchFunction: searchComputers },
        { id: 'searchPannes', listId: 'panne-list', selector: '.panne-item', searchFunction: searchPannes }
    ];

    searchInputs.forEach(({ id, listId, selector, searchFunction }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', searchFunction);
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const employeeList = document.querySelector('.employee-list');
        const employeeItems = employeeList.querySelectorAll('.employee-item');

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            employeeItems.forEach(item => {
                const employeeName = item.textContent.toLowerCase();
                item.style.display = employeeName.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    document.querySelectorAll('.employe-select').forEach(select => {
        select.addEventListener('change', function() {
            const employeId = this.value;
            const ordinateurId = this.dataset.ordinateurId;
            
            if (employeId) {
                fetch('/associer-employe-ordinateur', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeId, ordinateurId }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const computerItem = this.closest('.computer-item');
                        const assignedEmployeeSpan = computerItem.querySelector('.assigned-employee');
                        assignedEmployeeSpan.textContent = `${data.employe.firstName} ${data.employe.lastName}`;
                        
                        let desassignButton = computerItem.querySelector('.desassign-button');
                        if (!desassignButton) {
                            desassignButton = document.createElement('button');
                            desassignButton.className = 'desassign-button';
                            assignedEmployeeSpan.after(desassignButton);
                        }
                        desassignButton.textContent = 'Désassigner';
                        desassignButton.onclick = () => desassignerOrdinateur(data.employe.id, data.ordinateur.id);

                        const employeeItem = document.querySelector(`.employee-item[data-employee-id="${data.employe.id}"]`);
                        if (employeeItem) {
                            const ordinateurInfo = employeeItem.querySelector('.ordinateur-info');
                            ordinateurInfo.textContent = `(Ordinateur: ${data.ordinateur.nom})`;
                        }

                        console.log('Association réussie');
                    } else {
                        console.error('Erreur:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                });
            }
        });
    });

    window.openEmployeProfileModal = function(employeId) {
        fetch(`/employe-profile/${employeId}`)
            .then(response => response.json())
            .then(employe => {
                const content = document.getElementById('employeProfileContent');
                let blamesHtml = employe.blames && employe.blames.length > 0
                    ? `<h3>Blâmes (${employe.blames.length})</h3><ul>${employe.blames.map(blame => `<li>${blame.description} (Date: ${new Date(blame.date).toLocaleDateString()})</li>`).join('')}</ul>`
                    : '<p>Aucun blâme</p>';
    
                content.innerHTML = `
                    ${employe.avatar ? `<img src="/${employe.avatar}" alt="${employe.firstName} Avatar" style="max-width: 100px; max-height: 100px;">` : ''}
                    <p>Nom: ${employe.lastName}</p>
                    <p>Prénom: ${employe.firstName}</p>
                    <p>Email: ${employe.email}</p>
                    <p>Fonction: ${employe.fonction}</p>
                    <p>Age: ${employe.age}</p>
                    <p>Sexe: ${employe.sexe}</p>
                    ${blamesHtml}
                `;
                openModal('employeProfileModal');
            })
            .catch(error => console.error('Erreur:', error));
    };

    window.openEditEmployeModal = function(employeId) {
        fetch(`/employe-profile/${employeId}`)
            .then(response => response.json())
            .then(employe => {
                document.getElementById('editEmployeId').value = employe.id;
                document.getElementById('edit-firstName').value = employe.firstName;
                document.getElementById('edit-lastName').value = employe.lastName;
                document.getElementById('edit-email').value = employe.email;
                document.getElementById('edit-fonction').value = employe.fonction;
                document.getElementById('edit-age').value = employe.age;
                document.getElementById('edit-sexe').value = employe.sexe;
                openModal('editEmployeModal');
            })
            .catch(error => console.error('Erreur:', error));
    };

    window.openBlameModal = function(employeId) {
        document.getElementById('blameEmployeId').value = employeId;
        openModal('blameModal');
    };

    window.toggleAutreSexe = function(select, autreInputId) {
        document.getElementById(autreInputId).style.display = select.value === 'autre' ? 'block' : 'none';
    };

    window.openAssignTaskModal = function(employeId) {
        document.getElementById('assignTaskEmployeId').value = employeId;
        openModal('assignTaskModal');
    };

    const blameForm = document.getElementById('blameForm');
    if (blameForm) {
        blameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const employeId = document.getElementById('blameEmployeId').value;
            const description = document.getElementById('blame-description').value;
        
            fetch('/ajouter-blame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeId, description })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) location.reload();
                else console.error('Erreur lors de l\'ajout du blâme:', data.error || 'Erreur inconnue');
            })
            .catch(error => console.error('Erreur:', error));
        });
    }

    const btnEntreprise = document.getElementById("btnEntreprise");
    const btnEmploye = document.getElementById("btnEmploye");

    if (btnEntreprise) {
        btnEntreprise.onclick = () => openModal("modalEntreprise");
    }

    if (btnEmploye) {
        btnEmploye.onclick = () => openModal("modalEmploye");
    }

    const fonctionFilter = document.getElementById('fonction-filter');
    if (fonctionFilter) {
        const employeeList = document.querySelector('.employee-list');
        const employeeItems = employeeList.querySelectorAll('.employee-item');

        fonctionFilter.addEventListener('change', function() {
            const selectedFonction = this.value.toLowerCase();
            employeeItems.forEach(item => {
                const employeeFonction = item.querySelector('.employee-fonction').textContent.toLowerCase();
                item.style.display = (selectedFonction === '' || employeeFonction === selectedFonction) ? '' : 'none';
            });
        });
    }

    const buttons = document.querySelectorAll('#btn-container-desktop button');
    const sections = {
        'Dashboard': document.querySelector('.dashboard-content'),
        'Gestion des Employés': document.querySelector('.employees'),
        'Gestion des Ordinateurs': document.querySelector('.computers'),
        'Tâches en cours': document.querySelector('.tasks'),
        'Gestion des Pannes': document.querySelector('.pannes')
    };

    function showSection(sectionName) {
        Object.entries(sections).forEach(([key, section]) => {
            if (section) {
                section.style.display = key === sectionName ? 'block' : 'none';
            }
        });
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            showSection(button.textContent);
        });
    });

    showSection('Dashboard');

    document.querySelectorAll('.resoudre-panne-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const panneId = this.dataset.panneId;
 
            fetch(`/resoudre-panne/${panneId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    console.error('Erreur:', data.error);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
        });
    });
    
    window.desassignerOrdinateur = function(employeId, ordinateurId) {
        fetch('/desassigner-ordinateur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ employeId, ordinateurId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {     
                const computerItem = document.querySelector(`[data-ordinateur-id="${ordinateurId}"]`);
                if (computerItem) {
                    const assignedEmployeeSpan = computerItem.querySelector('.assigned-employee');
                    assignedEmployeeSpan.textContent = 'Non assigné';
                    const desassignButton = computerItem.querySelector('.desassign-button');
                    if (desassignButton) {
                        desassignButton.remove();
                    }
                    const selectElement = computerItem.querySelector('.employe-select');
                    selectElement.value = '';
                }
    
                const employeeItem = document.querySelector(`.employee-item[data-employee-id="${employeId}"]`);
                if (employeeItem) {
                    const ordinateurInfo = employeeItem.querySelector('.ordinateur-info');
                    ordinateurInfo.textContent = '(Pas d\'ordinateur)';
                }
    
                console.log('Ordinateur désassigné avec succès');
            } else {
               console.error('Erreur lors de la désassignation : ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    };
});
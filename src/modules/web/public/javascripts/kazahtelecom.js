

(function() {
    'use strict';

    $(function () {
        var $picker = $('#birthdate');
        $picker.datetimepicker({
            format: 'L',
            viewMode: 'years'
        })
        $picker.on("change.datetimepicker", function (e) {
            console.log('2324');
        });
    });

    window.addEventListener('load', function() {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();
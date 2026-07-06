(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.HoraCertaFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function roundCurrency(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function calculateDiscountMinutes(workedMinutes, dailyTargetMinutes) {
        const worked = Number(workedMinutes) || 0;
        const target = Number(dailyTargetMinutes) || 0;

        if (!target || worked >= target) {
            return 0;
        }

        return target - worked;
    }

    function calculateFinancialDiscount(minutesNegative, salary, cargaHorariaMensal) {
        const negativeMinutes = Number(minutesNegative) || 0;
        const salario = Number(salary) || 0;
        const cargaHoraria = Number(cargaHorariaMensal) || 0;

        if (negativeMinutes <= 0 || salario <= 0 || cargaHoraria <= 0) {
            return 0;
        }

        const valorHora = salario / cargaHoraria;
        const valorMinuto = valorHora / 60;
        return roundCurrency(negativeMinutes * valorMinuto);
    }

    function formatCurrencyBRL(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(value) || 0);
    }

    function isProfileConfigured(user) {
        return Boolean(user) && Number(user.salario) > 0 && Number(user.cargaHorariaMensal) > 0;
    }

    return {
        calculateDiscountMinutes,
        calculateFinancialDiscount,
        formatCurrencyBRL,
        isProfileConfigured
    };
});

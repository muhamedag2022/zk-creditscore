pragma circom 2.0.0;

include "comparators.circom";

template ScoreVerifier(threshold) {
    // المدخلات
    signal input score;          // (Private) سكور المستخدم - لا يظهر للعامة
    signal input userAddress;    // (Public) عنوان المحفظة لربط الإثبات بصاحبه
    
    // المخرجات
    signal output isEligible;    // 1 إذا كان مؤهلاً، 0 إذا لم يكن

    // استخدام مكون المقارنة من مكتبة circomlib
    // GreaterEqualThan(عدد البتات)
    component geq = GreaterEqualThan(32);
    
    geq.in[0] <== score;
    geq.in[1] <== threshold;

    // النتيجة النهائية
    isEligible <== geq.out;
    
    // قيد (Constraint): يجب أن تكون النتيجة 1 لكي يُقبل الإثبات
    isEligible === 1;
}

// تشغيل الدائرة مع حد أدنى 50 نقطة كمعامل (Parameter)
component main {public [userAddress]} = ScoreVerifier(50);
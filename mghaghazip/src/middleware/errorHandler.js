module.exports = function errorHandler(err, req, res, next) {
  console.error(err);

  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('errors/error', {
      title: 'تعذر إكمال الطلب',
      message: 'حجم الملف يتجاوز الحد المسموح به (5 ميجابايت).'
    });
  }

  if (err && err.name === 'MulterError') {
    return res.status(400).render('errors/error', {
      title: 'تعذر إكمال الطلب',
      message: 'حدث خطأ أثناء رفع الملف: ' + err.message
    });
  }

  const status = err.status || 500;
  res.status(status).render('errors/error', {
    title: status === 500 ? 'حدث خطأ' : 'تعذر إكمال الطلب',
    message: status === 500
      ? 'حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا.'
      : (err.message || 'حدث خطأ في معالجة طلبك.')
  });
};

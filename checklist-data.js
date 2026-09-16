// Данные чек-листа по Приложению A технического задания (PRD2.md).
// Каждый пункт: параметр, описание источника (для отображения) и домены источников
// (используются для формирования поисковой ссылки с подставленным идентификатором клиента).
// Прямые диплинки на госреестры не строятся намеренно — ТЗ (раздел 7) исключает
// автоматический парсинг/интеграцию с egov.kz, kgd.gov.kz, sud.gov.kz, goszakup.gov.kz и т.п.,
// поэтому инструмент только готовит ссылку на ручную проверку (сайт + поиск по сайту).

const CHECKLIST_SECTIONS = {
  legal: [
    {
      id: 'legal',
      title: 'A.1 Юридическое лицо',
      items: [
        { param: 'Наименование, БИН, дата регистрации', sourceLabel: 'egov.kz / Мин. юстиции', domains: ['egov.kz'], useId: 'bin' },
        { param: 'ОКЭД (вид деятельности)', sourceLabel: 'stat.gov.kz', domains: ['stat.gov.kz'], useId: 'bin' },
        { param: 'Статус юрлица (действует/ликвидация)', sourceLabel: 'egov.kz', domains: ['egov.kz'], useId: 'bin' },
        { param: 'Судебные споры, иски', sourceLabel: 'sud.gov.kz', domains: ['sud.gov.kz'], useId: 'name' },
        { param: 'Реестр недобросовестных поставщиков', sourceLabel: 'goszakup.gov.kz', domains: ['goszakup.gov.kz'], useId: 'bin' },
        { param: 'Налоговая задолженность / неблагонадёжность', sourceLabel: 'portal.kgd.gov.kz', domains: ['portal.kgd.gov.kz'], useId: 'bin' },
        { param: 'Банкротство / реструктуризация', sourceLabel: 'kgd.gov.kz', domains: ['kgd.gov.kz'], useId: 'bin' },
        { param: 'Руководитель, учредители', sourceLabel: 'egov.kz', domains: ['egov.kz'], useId: 'bin' },
        { param: 'Новости о компании', sourceLabel: 'СМИ / Google Новости', domains: [], news: true, useId: 'name' },
        { param: 'Сайт, соцсети, LinkedIn компании', sourceLabel: 'открытые источники', domains: ['linkedin.com'], useId: 'name' },
        { param: 'Отзывы, репутация', sourceLabel: '2GIS, Zoon, Kompass', domains: ['2gis.kz', 'zoon.kz', 'kompass.com'], useId: 'name' },
      ],
    },
    {
      id: 'financial',
      title: 'A.2 Финансовые показатели',
      items: [
        { param: 'Финансовая отчётность (баланс, ОПиУ)', sourceLabel: 'dfo.kz', domains: ['dfo.kz'], useId: 'bin' },
        { param: 'Выручка, прибыль по годам', sourceLabel: 'dfo.kz', domains: ['dfo.kz'], useId: 'bin' },
        { param: 'Статус в рейтинге крупных налогоплательщиков', sourceLabel: 'kgd.gov.kz', domains: ['kgd.gov.kz'], useId: 'bin' },
        { param: 'Регистрация плательщиком НДС', sourceLabel: 'portal.kgd.gov.kz', domains: ['portal.kgd.gov.kz'], useId: 'bin' },
        { param: 'Сумма и число контрактов по госзакупкам', sourceLabel: 'goszakup.gov.kz', domains: ['goszakup.gov.kz'], useId: 'bin' },
        { param: 'Данные по налогам недропользователей (если применимо)', sourceLabel: 'kgd.gov.kz', domains: ['kgd.gov.kz'], useId: 'bin' },
        { param: 'Кредитный рейтинг (если присвоен)', sourceLabel: "S&P, Moody's, Fitch, ACRA", domains: [], useId: 'name' },
        { param: 'Листинг / ценные бумаги на бирже', sourceLabel: 'kase.kz', domains: ['kase.kz'], useId: 'name' },
        { param: 'Место в рейтингах (Forbes Kazakhstan и др.)', sourceLabel: 'открытые СМИ-рейтинги', domains: ['forbes.kz'], useId: 'name' },
      ],
    },
  ],
  individual: [
    {
      id: 'individual',
      title: 'A.3 Физическое лицо',
      items: [
        { param: 'Публичный статус (руководитель, ИП, публичная персона)', sourceLabel: 'открытые источники', domains: [], useId: 'name' },
        { param: 'Профессиональная деятельность / бизнес', sourceLabel: 'публичный профиль, СМИ', domains: [], useId: 'name' },
        { param: 'Статус ИП, связанные компании', sourceLabel: 'egov.kz', domains: ['egov.kz'], useId: 'iin' },
        { param: 'Упоминания в СМИ', sourceLabel: 'Google/Yandex новости', domains: [], news: true, useId: 'name' },
        { param: 'Публичные соцсети', sourceLabel: 'LinkedIn, Facebook, Instagram', domains: ['linkedin.com', 'facebook.com', 'instagram.com'], useId: 'name' },
        { param: 'Декларация о доходах (только отдельные категории гос. служащих)', sourceLabel: 'публикации госорганов/СМИ', domains: [], useId: 'name' },
      ],
    },
  ],
};

// Примечание из ТЗ: точные суммы уплаченных налогов по большинству компаний закрыты
// (налоговая тайна, ст. 30 НК РК) — соответствующего пункта в чек-листе нет намеренно.

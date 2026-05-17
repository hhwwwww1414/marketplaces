# ТЗ для Codex: MVP универсального инструмента оценки и прогнозирования проектов на маркетплейсах с Vercel + LLM

## 1. Контекст проекта

Нужно реализовать MVP-продукт для выпускной квалификационной работы на тему:

**«Разработка универсального инструмента комплексной оценки и прогнозирования результатов реализации проектов в сфере электронной коммерции (на примере маркетплейсов)»**

Тему дипломной работы менять запрещено. Поэтому продукт должен быть реализован и описан именно как:

> **универсальный инструмент комплексной оценки и прогнозирования результатов реализации проектов на маркетплейсах**

Нельзя позиционировать продукт как обычный BI-дашборд, CRM, учетную систему, сервис аналитики продаж или SaaS для продавцов. Дашборды, графики, LLM и фронтенд — это части инструмента, но не замена основной исследовательской логики.

Репозиторий:

```text
https://github.com/hhwwwww1414/marketplaces
```

Нужно реализовать продукт под ключ, подготовить к деплою на Vercel и запушить код в GitHub.

---

## 2. Изменение архитектурного решения

Ранее рассматривался локальный Streamlit-вариант, но теперь нужно реализовать MVP под деплой на **Vercel**.

Это означает:

1. Не использовать VPS.
2. Не использовать Streamlit.
3. Не использовать постоянный backend-сервер.
4. Не использовать полноценную базу данных в MVP.
5. Сделать минимальный web frontend.
6. Хранить входные данные как константные подготовленные данные внутри проекта.
7. Реализовать LLM-модуль через serverless API route.
8. Деплоить приложение на Vercel.

---

## 3. Главная идея MVP

MVP должен представлять собой web-приложение, которое:

1. Использует заранее подготовленные константные данные из выгрузок Ozon и Wildberries.
2. Позволяет просматривать входные данные в табличном виде.
3. Приводит данные маркетплейсов к единой нормализованной модели.
4. Рассчитывает систему показателей по четырем блокам:
   - финансовый блок;
   - клиентский блок;
   - операционный блок;
   - платформенный блок.
5. Формирует интегральную оценку проекта `Project Score`.
6. Позволяет сравнивать базовый и проектный периоды.
7. Строит простой сценарный прогноз.
8. Показывает графики и более детальную аналитику.
9. Использует LLM через OpenRouter API для управленческой интерпретации результатов.
10. Разворачивается на Vercel.

LLM не должна выполнять численные расчеты. Все KPI, прогнозы и баллы считаются кодом. LLM получает только агрегированные и обезличенные показатели и формирует текстовые выводы.

---

## 4. Технологический стек

Использовать:

```text
Next.js
TypeScript
React
Tailwind CSS
Recharts или Plotly.js
TanStack Table или простая таблица на React
Zod
xlsx
papaparse
date-fns
OpenRouter API
Vercel
```

Рекомендуемый вариант:

```text
Next.js App Router + TypeScript + Tailwind CSS + Recharts
```

Можно использовать UI-библиотеку:

```text
shadcn/ui
```

Если это ускоряет разработку, можно использовать обычные компоненты без shadcn/ui.

---

## 5. Входные данные

В MVP входные данные считаются **константными**.

Исходные файлы:

```text
orders-4.csv
orders-5.csv
supplier-goods-1390417-2025-01-01-2025-12-31-vtsxnkhiw.XLSX
report_2026_4_18.xlsx (2).XLSX
```

Файлы относятся к Ozon и Wildberries.

### 5.1. Важное ограничение по GitHub

Репозиторий публичный. Поэтому реальные сырые выгрузки нельзя коммитить в GitHub, если в них есть персональные данные покупателей или коммерчески чувствительные данные.

В MVP нужно сделать так:

1. Сырые файлы лежат локально в папке:

```text
data/source/
```

2. Папка `data/source/` должна быть добавлена в `.gitignore`.

3. Скрипт подготовки данных читает файлы из `data/source/`, удаляет персональные данные, агрегирует и формирует безопасные JSON-константы.

4. В репозиторий можно коммитить только подготовленные обезличенные данные:

```text
src/data/generated/
```

5. Если данные остаются чувствительными, вместо реальных значений нужно создать демо-набор с такой же структурой, но с измененными числовыми значениями.

---

## 6. Поддерживаемые типы файлов

### 6.1. Ozon orders CSV

Файлы:

```text
orders-4.csv
orders-5.csv
```

Особенности:

```text
CSV
разделитель: ;
кодировка: utf-8-sig
```

Возможные поля:

```text
Номер заказа
Номер отправления
Принят в обработку
Дата отгрузки
Дата отгрузки без просрочки
Статус
Дата доставки
Фактическая дата передачи в доставку
Дата отмены
Сумма отправления
Название товара
SKU
Артикул
Ваша цена
Оплачено покупателем
Количество
Выкуп товара
Цена товара до скидок
Скидка %
Скидка руб
Кластер отгрузки
Кластер доставки
Регион доставки
Город доставки
Способ доставки
Склад отгрузки
Способ отгрузки
Перевозчик
```

PII-поля, которые обязательно нужно удалить:

```text
Имя покупателя
Email покупателя
Имя получателя
Телефон получателя
Адрес доставки
Адрес покупателя
Индекс
```

Эти поля нельзя:
- показывать во frontend;
- сохранять в generated JSON;
- отправлять в LLM;
- коммитить в GitHub.

---

### 6.2. Wildberries supplier-goods XLSX

Файл:

```text
supplier-goods-1390417-2025-01-01-2025-12-31-vtsxnkhiw.XLSX
```

Особенности:

```text
лист: Sheet1
первая строка может быть техническим заголовком
реальные заголовки начинаются ниже
```

Ключевые поля:

```text
Бренд
Предмет
Сезон
Коллекция
Наименование
Артикул продавца
Артикул WB
Баркод
Размер
Контракт
Склад
шт.
Сумма заказов минус комиссия WB, руб.
Выкупили, шт.
К перечислению за товар, руб.
Текущий остаток, шт.
```

Поле `шт.` нужно нормализовать как:

```text
orders_qty
```

---

### 6.3. Wildberries daily report XLSX

Файл:

```text
report_2026_4_18.xlsx (2).XLSX
```

Особенности:

```text
лист: report
поле День может быть Excel serial date
```

Ключевые поля:

```text
Бренд
Неделя года
День
Артикул продавца
Выкупили, шт.
К перечислению за товар, руб.
Заказано, шт.
Сумма заказов минус комиссия WB, руб.
```

Поле `День` нужно преобразовать в обычную дату формата:

```text
YYYY-MM-DD
```

---

## 7. Нормализованная модель данных

Все данные нужно привести к единой модели.

Минимальный тип записи:

```ts
export type NormalizedRecord = {
  id: string;
  sourceFile: string;
  marketplace: "ozon" | "wildberries";
  sourceType: "ozon_orders" | "wb_supplier_goods" | "wb_daily_report";

  date: string | null;
  week: number | null;

  brand: string | null;
  category: string | null;
  productName: string | null;
  sellerArticle: string | null;
  sku: string | null;
  barcode: string | null;

  warehouse: string | null;
  region: string | null;
  city: string | null;
  deliveryCluster: string | null;
  shippingCluster: string | null;
  deliveryMethod: string | null;

  status: string | null;

  ordersQty: number;
  buyoutQty: number;
  deliveredQty: number;
  cancelledQty: number;
  stockQty: number;

  grossRevenue: number;
  netRevenue: number;
  paidByCustomer: number;
  itemPrice: number;
  discountRub: number;

  processingDateTime: string | null;
  shipmentDateTime: string | null;
  deliveryDateTime: string | null;
  cancellationDateTime: string | null;

  processingHours: number | null;

  isCancelled: boolean;
  isDelivered: boolean;
  isBuyout: boolean;
};
```

Если значения нет в исходной выгрузке:

- для строк использовать `null`;
- для дат использовать `null`;
- для чисел использовать `0`;
- для boolean использовать `false`.

---

## 8. Подготовка данных

Нужно реализовать отдельный скрипт подготовки данных:

```text
scripts/prepare-data.ts
```

Скрипт должен:

1. Прочитать файлы из `data/source/`.
2. Определить тип файла.
3. Удалить PII-поля.
4. Нормализовать данные.
5. Сохранить результат в:

```text
src/data/generated/normalized-records.json
src/data/generated/kpi-summary.json
src/data/generated/source-previews.json
```

Если исходных файлов нет, скрипт должен не падать, а показать понятную ошибку:

```text
Не найдены исходные файлы в data/source/. Положите выгрузки Ozon/WB в эту папку и повторите npm run prepare:data.
```

Команда:

```bash
npm run prepare:data
```

---

## 9. Структура проекта

Нужно реализовать такую структуру:

```text
marketplaces/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .gitignore
├── vercel.json
├── data/
│   ├── source/
│   │   └── .gitkeep
│   └── README.md
├── docs/
│   ├── technical_spec.md
│   ├── diploma_alignment.md
│   ├── vercel_deployment.md
│   └── user_guide.md
├── scripts/
│   └── prepare-data.ts
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── source-data/
│   │   │   └── page.tsx
│   │   ├── project-evaluation/
│   │   │   └── page.tsx
│   │   ├── forecasting/
│   │   │   └── page.tsx
│   │   ├── llm-analyst/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── llm/
│   │   │       └── analyze/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ChartCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   ├── PeriodSelector.tsx
│   │   └── EmptyState.tsx
│   ├── data/
│   │   └── generated/
│   │       ├── normalized-records.json
│   │       ├── kpi-summary.json
│   │       └── source-previews.json
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── data-access.ts
│   │   ├── normalization.ts
│   │   ├── metrics.ts
│   │   ├── scoring.ts
│   │   ├── forecasting.ts
│   │   ├── privacy.ts
│   │   ├── llm.ts
│   │   ├── prompts.ts
│   │   └── utils.ts
│   └── types/
│       ├── marketplace.ts
│       └── analytics.ts
└── tests/
    ├── privacy.test.ts
    ├── metrics.test.ts
    ├── scoring.test.ts
    └── forecasting.test.ts
```

---

## 10. Страницы frontend

### 10.1. Главная страница `/`

Главная страница должна объяснять назначение инструмента.

Название:

```text
Универсальный инструмент комплексной оценки и прогнозирования результатов проектов на маркетплейсах
```

Показать:

- краткое описание MVP;
- какие маркетплейсы поддерживаются;
- какие данные используются;
- основные модули:
  - просмотр входных данных;
  - KPI-дашборд;
  - оценка проекта;
  - прогнозирование;
  - LLM-аналитик;
- статус:
  - количество записей;
  - количество маркетплейсов;
  - период данных;
  - количество SKU/артикулов.

---

### 10.2. Страница `/source-data`

Назначение: просмотр входных данных.

Нужно сделать:

1. Таблицу нормализованных записей.
2. Фильтры:
   - marketplace;
   - sourceType;
   - date range;
   - SKU / артикул;
   - склад;
   - регион.
3. Поиск по названию товара или артикулу.
4. Переключатель:
   - нормализованные данные;
   - превью исходных данных без PII.
5. Пагинацию.
6. Счетчик строк после фильтрации.

Важно: на этой странице нельзя показывать PII.

---

### 10.3. Страница `/dashboard`

Назначение: общая аналитика по всем данным.

Показать карточки KPI:

```text
Заказы
Выкупы
Доля выкупа
Отмены
Доля отмен
Gross Revenue
Net Revenue
Средний чек
Активные SKU
Остатки
Количество складов
Количество регионов
```

Графики:

1. Динамика заказов по дням/неделям.
2. Динамика net revenue.
3. Buyout rate по времени.
4. Топ-10 товаров по заказам.
5. Топ-10 товаров по net revenue.
6. Распределение заказов по складам.
7. Распределение заказов по регионам.
8. Сравнение Ozon и Wildberries.

---

### 10.4. Страница `/project-evaluation`

Назначение: оценка результата проекта.

Пользователь должен выбрать:

- название проекта;
- маркетплейс:
  - Ozon;
  - Wildberries;
  - Все;
- SKU / артикул:
  - конкретный;
  - все;
- базовый период;
- проектный период;
- веса блоков:
  - financial;
  - customer;
  - operational;
  - platform.

По умолчанию веса:

```ts
const DEFAULT_WEIGHTS = {
  financial: 0.35,
  customer: 0.25,
  operational: 0.25,
  platform: 0.15,
};
```

Если сумма весов не равна 1, приложение должно нормализовать веса или показать предупреждение.

Показать:

1. `Project Score`.
2. Баллы по блокам:
   - financial score;
   - customer score;
   - operational score;
   - platform score.
3. Сравнение baseline vs project:
   - orders;
   - buyouts;
   - buyout rate;
   - cancellation rate;
   - gross revenue;
   - net revenue;
   - average order value;
   - active SKU;
   - stock.
4. График изменения KPI.
5. Таблицу расшифровки.
6. Автоматически рассчитанные риски.

---

### 10.5. Страница `/forecasting`

Назначение: прогнозирование результатов.

Пользователь выбирает:

- marketplace;
- SKU / артикул;
- горизонт прогноза:
  - 30 дней;
  - 60 дней;
  - 90 дней;
- сценарий:
  - пессимистичный;
  - базовый;
  - оптимистичный.

MVP-прогноз:

```text
baseForecast = rolling average или exponential moving average
pessimistic = baseForecast * 0.85
base = baseForecast
optimistic = baseForecast * 1.15
```

Прогнозировать:

```text
ordersQty
buyoutQty
netRevenue
Project Score
```

Показать:

1. Фактическую динамику.
2. Прогнозную динамику.
3. Сценарную таблицу.
4. Сравнение сценариев.
5. Прогнозный Project Score.

---

### 10.6. Страница `/llm-analyst`

Назначение: LLM-интерпретация результатов.

На странице должна быть кнопка:

```text
Сформировать управленческое заключение
```

LLM должна формировать:

1. краткое управленческое заключение;
2. объяснение Project Score;
3. сильные стороны проекта;
4. слабые стороны проекта;
5. риски;
6. рекомендации;
7. текст для диплома;
8. список ограничений анализа.

Также нужна кнопка:

```text
Скачать заключение в Markdown
```

---

## 11. Расчетные показатели

### 11.1. Финансовый блок

Показатели:

```text
grossRevenue
netRevenue
paidByCustomer
avgOrderValue
avgNetRevenuePerBuyout
revenueGrowthRate
netRevenueGrowthRate
```

Формулы:

```text
avgOrderValue = grossRevenue / ordersQty
avgNetRevenuePerBuyout = netRevenue / buyoutQty
revenueGrowthRate = (projectGrossRevenue - baselineGrossRevenue) / baselineGrossRevenue
netRevenueGrowthRate = (projectNetRevenue - baselineNetRevenue) / baselineNetRevenue
```

---

### 11.2. Клиентский блок

Показатели:

```text
ordersQty
buyoutQty
buyoutRate
cancellationRate
deliveredRate
```

Формулы:

```text
buyoutRate = buyoutQty / ordersQty
cancellationRate = cancelledQty / ordersQty
deliveredRate = deliveredQty / ordersQty
```

---

### 11.3. Операционный блок

Показатели:

```text
avgProcessingHours
stockQty
stockoutRisk
warehouseCount
ordersPerWarehouse
buyoutRateByWarehouse
```

Простая логика `stockoutRisk`:

```text
если stockQty = 0 и ordersQty > 0 → высокий риск
если stockQty < средних дневных заказов * 7 → средний риск
иначе → низкий риск
```

---

### 11.4. Платформенный блок

Показатели:

```text
activeSkuCount
topSkuShare
skuConcentrationIndex
categoryCount
regionCount
warehouseCoverage
platformPresenceScore
```

Пример:

```text
topSkuShare = ordersQtyTopSku / totalOrdersQty
```

Чем выше концентрация на одном SKU, тем выше риск зависимости от одного товара.

---

## 12. Project Score

Каждый блок должен рассчитываться по шкале 0–100.

Итоговая формула:

```text
Project Score =
financialScore * financialWeight +
customerScore * customerWeight +
operationalScore * operationalWeight +
platformScore * platformWeight
```

Нужно реализовать функцию:

```ts
calculateProjectScore(input: ProjectScoreInput): ProjectScoreResult
```

Пример результата:

```ts
{
  totalScore: 78,
  financialScore: 82,
  customerScore: 74,
  operationalScore: 69,
  platformScore: 86,
  interpretation: "Проект имеет высокий потенциал, но требует контроля операционных рисков."
}
```

---

## 13. LLM через OpenRouter

### 13.1. Переменные окружения

Создать `.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_APP_NAME=Marketplace Project Evaluation MVP
```

`.env.local` должен быть в `.gitignore`.

API-ключ нельзя:
- хардкодить;
- коммитить;
- выводить во frontend.

---

### 13.2. API route

Реализовать:

```text
POST /api/llm/analyze
```

Файл:

```text
src/app/api/llm/analyze/route.ts
```

Вход:

```ts
{
  mode: "project_evaluation" | "forecast" | "dashboard";
  payload: SanitizedAnalyticsPayload;
}
```

Выход:

```ts
{
  ok: boolean;
  content?: string;
  error?: string;
}
```

Если API-ключ не задан:

```text
LLM-модуль отключен: не найден OPENROUTER_API_KEY. Расчеты и дашборды доступны без LLM.
```

---

### 13.3. Что отправлять в LLM

Отправлять только агрегированные данные:

```text
Project Score
баллы по блокам
KPI baseline
KPI project
изменения KPI
прогнозные значения
риски, рассчитанные кодом
```

---

### 13.4. Что нельзя отправлять в LLM

Нельзя отправлять:

```text
имена покупателей
email
телефоны
адреса
индексы
сырые строки заказов
любые персональные данные
```

Нужно реализовать функцию:

```ts
sanitizeForLLM(input: unknown): SanitizedAnalyticsPayload
```

---

## 14. Privacy слой

Реализовать файл:

```text
src/lib/privacy.ts
```

В нем должны быть:

```ts
export const PII_COLUMNS = [
  "Имя покупателя",
  "Email покупателя",
  "Имя получателя",
  "Телефон получателя",
  "Адрес доставки",
  "Адрес покупателя",
  "Индекс",
];

export function removePIIColumns<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[];

export function sanitizeForLLM(payload: unknown): unknown;
```

Добавить тест, который проверяет, что PII-поля удаляются.

---

## 15. UX и визуальный стиль

Интерфейс должен быть минимальным, но аккуратным.

Требования:

1. Светлая тема.
2. Простая навигация слева или сверху.
3. Карточки KPI.
4. Графики.
5. Таблицы.
6. Понятные empty states.
7. Понятные warning-сообщения.
8. Адаптивность под ноутбук.

Не нужно делать сложный дизайн. Главное — показать работоспособность инструмента и управленческую аналитику.

---

## 16. Документация

### 16.1. README.md

README должен содержать:

1. описание проекта;
2. связь с темой диплома;
3. архитектуру;
4. инструкцию по локальному запуску;
5. инструкцию по подготовке данных;
6. инструкцию по настройке OpenRouter;
7. инструкцию по деплою на Vercel;
8. предупреждение про персональные данные;
9. описание страниц приложения;
10. описание ограничений MVP.

---

### 16.2. docs/diploma_alignment.md

Создать документ, где объяснить соответствие MVP теме диплома:

```text
Универсальность:
единая нормализованная модель данных для Ozon и Wildberries.

Комплексная оценка:
четыре блока показателей: финансовый, клиентский, операционный, платформенный.

Прогнозирование:
сценарный прогноз заказов, выкупов, net revenue и Project Score.

LLM:
используется как модуль объяснения результата и генерации управленческих рекомендаций.

Практическая ценность:
инструмент помогает сравнивать проекты, выявлять риски и принимать решения до запуска инициатив.
```

---

### 16.3. docs/vercel_deployment.md

Описать:

1. как подключить GitHub-репозиторий к Vercel;
2. какие env vars добавить;
3. какая build command используется;
4. какая output directory используется;
5. как проверить деплой.

---

## 17. package.json scripts

Добавить команды:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "prepare:data": "tsx scripts/prepare-data.ts"
  }
}
```

Можно использовать `vitest` вместо `jest`.

---

## 18. Тесты

Сделать минимальные тесты:

1. `privacy.test.ts`
   - проверка удаления PII;
   - проверка, что sanitizeForLLM не пропускает PII.

2. `metrics.test.ts`
   - расчет buyoutRate;
   - расчет cancellationRate;
   - расчет avgOrderValue.

3. `scoring.test.ts`
   - расчет Project Score;
   - нормализация весов.

4. `forecasting.test.ts`
   - построение прогноза;
   - сценарии 0.85 / 1 / 1.15.

Команда:

```bash
npm test
```

---

## 19. Vercel

Приложение должно быть готово к деплою на Vercel.

Требования:

1. Проект должен билдиться командой:

```bash
npm run build
```

2. В Vercel нужно добавить env vars:

```text
OPENROUTER_API_KEY
OPENROUTER_MODEL
OPENROUTER_BASE_URL
NEXT_PUBLIC_APP_NAME
```

3. API route `/api/llm/analyze` должен работать как serverless function.

4. Если OpenRouter key не задан, frontend должен показать сообщение, что LLM отключен, но остальная аналитика работает.

---

## 20. Git-задача

Нужно выполнить:

```bash
git clone https://github.com/hhwwwww1414/marketplaces.git
cd marketplaces
git checkout -b feature/vercel-mvp
```

После реализации:

```bash
npm install
npm run prepare:data
npm test
npm run build
git status
git add .
git commit -m "Implement Vercel MVP for marketplace project evaluation"
git push -u origin feature/vercel-mvp
```

Затем создать Pull Request в `main`.

Если пользователь явно разрешит пушить сразу в main, можно пушить в main, но предпочтительный вариант — отдельная ветка и PR.

---

## 21. Критерии приемки

MVP считается готовым, если:

1. Проект реализован на Next.js + TypeScript.
2. Проект запускается локально:

```bash
npm run dev
```

3. Проект успешно билдится:

```bash
npm run build
```

4. Есть подготовка данных:

```bash
npm run prepare:data
```

5. Реальные сырые файлы не коммитятся.
6. Есть нормализованные обезличенные JSON-данные.
7. На странице `/source-data` можно просмотреть входные данные.
8. На странице `/dashboard` есть KPI и графики.
9. На странице `/project-evaluation` считается Project Score.
10. На странице `/forecasting` строится прогноз.
11. На странице `/llm-analyst` работает OpenRouter-интеграция.
12. Без OpenRouter API key приложение не падает.
13. Есть README и документация.
14. Есть тесты.
15. Проект готов к деплою на Vercel.

---

## 22. Ограничения MVP

В MVP не нужно делать:

```text
авторизацию
личные кабинеты
VPS
Docker как основной способ запуска
базу данных
загрузку файлов в production-интерфейсе
интеграцию с реальными API маркетплейсов
сложные ML-модели
платежи
роли пользователей
SaaS-логику
```

---

## 23. Что важно не сломать

1. Не менять тему дипломной работы.
2. Не превращать продукт в обычный дашборд.
3. Не отправлять сырые данные в LLM.
4. Не коммитить API-ключи.
5. Не коммитить PII.
6. Не делать расчеты внутри LLM.
7. Не делать VPS-архитектуру.
8. Не усложнять MVP сверх необходимости.

---

## 24. Итоговый ожидаемый результат

На выходе должен быть web-MVP, который можно использовать как практическую часть дипломной работы.

Цепочка работы инструмента:

```text
константные обезличенные данные Ozon/Wildberries
→ нормализованная модель
→ просмотр входных данных
→ KPI-дашборд
→ комплексная оценка Project Score
→ сценарный прогноз
→ LLM-интерпретация через OpenRouter
→ управленческое заключение
```

Ключевая формулировка продукта:

> Разработанный MVP представляет собой универсальный инструмент комплексной оценки и прогнозирования результатов реализации проектов на маркетплейсах, который объединяет данные Ozon и Wildberries в единую аналитическую модель, рассчитывает систему финансовых, клиентских, операционных и платформенных показателей, формирует интегральную оценку проекта, строит сценарный прогноз и использует LLM-модуль для объяснения результатов и подготовки управленческих рекомендаций.

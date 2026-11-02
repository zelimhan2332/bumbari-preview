# Bumbari — конструктор выкроек

**Тестовая версия:** [открыть сайт](https://zelimhan2332.github.io/bumbari-preview/)

Это единый репозиторий проекта: браузерное приложение находится в `preview/`, документация проекта — в `docs/`, навык и заметки по методике — в `skills/mueller-patternmaking/`. Публикуемая тестовая версия собирается из ветки `test`; ссылка остаётся прежней.

## Быстрый старт

Открой `preview/index.html` в Chrome. Запустить проверки из PowerShell можно командой `Get-ChildItem preview -Filter '*.test.js' | ForEach-Object { node $_.FullName }`. Детали готовности и известные ограничения — в [IMPLEMENTATION.md](IMPLEMENTATION.md). Основная памятка для новых чатов и ИИ — [docs/PROJECT-HANDOFF-RU.md](docs/PROJECT-HANDOFF-RU.md).

## Методика и книги

Работаем по «Мюллер и сын». Навык и собственные справочные заметки: [skills/mueller-patternmaking/SKILL.md](skills/mueller-patternmaking/SKILL.md). Каталог книг и этапы изучения: [docs/SOURCES.md](docs/SOURCES.md), [docs/STUDY.md](docs/STUDY.md).

PDF книг и OCR остаются у владельца и в репозиторий не загружаются. Для локального поиска задай `MUELLER_LIBRARY_ROOT`, при необходимости `MUELLER_BOOK_B10` и `MUELLER_OCR_CACHE`. Не сохраняй личные мерки, клиентские фотографии, ключи и пароли.

## Изменения

Рабочие изменения оформляй в отдельной ветке и PR в `test`. После слияния GitHub Actions проверяет проект и обновляет тестовый сайт. Не работай в старой отдельной копии `mueller`; вся текущая работа теперь ведётся в этом репозитории.

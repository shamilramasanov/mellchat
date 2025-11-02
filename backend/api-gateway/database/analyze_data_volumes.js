// Script to analyze data volumes in database
const databaseService = require('../src/services/databaseService');

async function analyzeDataVolumes() {
  try {
    console.log('📊 Анализ объемов данных в базе данных MellChat\n');
    console.log('='.repeat(60));

    // 1. Анализ таблицы messages
    console.log('\n📝 ТАБЛИЦА: messages (Сообщения чата)');
    console.log('-'.repeat(60));
    
    const messagesStats = await databaseService.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT platform) as platforms_count,
        COUNT(DISTINCT stream_id) as unique_streams,
        COUNT(DISTINCT username) as unique_users,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message,
        AVG(LENGTH(content)) as avg_message_length,
        COUNT(*) FILTER (WHERE is_spam = true) as spam_messages,
        COUNT(*) FILTER (WHERE is_question = true) as question_messages,
        COUNT(*) FILTER (WHERE sentiment = 'happy') as happy_messages,
        COUNT(*) FILTER (WHERE sentiment = 'sad') as sad_messages,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_messages
      FROM messages
    `);

    if (messagesStats.rows && messagesStats.rows.length > 0) {
      const stats = messagesStats.rows[0];
      console.log(`  Всего сообщений: ${parseInt(stats.total_messages || 0).toLocaleString()}`);
      console.log(`  Платформ: ${stats.platforms_count || 0}`);
      console.log(`  Уникальных стримов: ${stats.unique_streams || 0}`);
      console.log(`  Уникальных пользователей: ${parseInt(stats.unique_users || 0).toLocaleString()}`);
      console.log(`  Первое сообщение: ${stats.first_message || 'N/A'}`);
      console.log(`  Последнее сообщение: ${stats.last_message || 'N/A'}`);
      console.log(`  Средняя длина сообщения: ${Math.round(stats.avg_message_length || 0)} символов`);
      console.log(`  Спам сообщений: ${parseInt(stats.spam_messages || 0).toLocaleString()} (${((stats.spam_messages / stats.total_messages) * 100 || 0).toFixed(2)}%)`);
      console.log(`  Вопросов: ${parseInt(stats.question_messages || 0).toLocaleString()} (${((stats.question_messages / stats.total_messages) * 100 || 0).toFixed(2)}%)`);
      console.log(`  Настроение: Happy ${parseInt(stats.happy_messages || 0).toLocaleString()}, Neutral ${parseInt(stats.neutral_messages || 0).toLocaleString()}, Sad ${parseInt(stats.sad_messages || 0).toLocaleString()}`);
    }

    // Размер данных по платформам
    const platformStats = await databaseService.query(`
      SELECT 
        platform,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM messages) as percentage,
        AVG(LENGTH(content)) as avg_length
      FROM messages
      GROUP BY platform
      ORDER BY count DESC
    `);

    if (platformStats.rows && platformStats.rows.length > 0) {
      console.log('\n  По платформам:');
      platformStats.rows.forEach(row => {
        console.log(`    ${row.platform || 'unknown'}: ${parseInt(row.count || 0).toLocaleString()} (${parseFloat(row.percentage || 0).toFixed(1)}%) - средняя длина: ${Math.round(row.avg_length || 0)}`);
      });
    }

    // Статистика по времени
    const timeStats = await databaseService.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as messages_count,
        COUNT(DISTINCT stream_id) as streams_count
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 10
    `);

    if (timeStats.rows && timeStats.rows.length > 0) {
      console.log('\n  За последние 10 дней:');
      timeStats.rows.forEach(row => {
        console.log(`    ${row.date}: ${parseInt(row.messages_count || 0).toLocaleString()} сообщений, ${row.streams_count || 0} стримов`);
      });
    }

    // 2. Анализ таблицы users
    console.log('\n\n👥 ТАБЛИЦА: users (Пользователи чата)');
    console.log('-'.repeat(60));
    
    let usersStats;
    try {
      usersStats = await databaseService.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(DISTINCT username) as unique_usernames,
          SUM(questions_posted) as total_questions_posted
        FROM users
      `);
    } catch (error) {
      console.log('  Таблица users не найдена или пуста');
      usersStats = { rows: [{ total_users: 0, unique_usernames: 0, total_questions_posted: 0 }] };
    }

    if (usersStats.rows && usersStats.rows.length > 0) {
      const stats = usersStats.rows[0];
      console.log(`  Всего пользователей: ${parseInt(stats.total_users || 0).toLocaleString()}`);
      console.log(`  Уникальных имен: ${parseInt(stats.unique_usernames || 0).toLocaleString()}`);
      console.log(`  Всего вопросов задано: ${parseInt(stats.total_questions_posted || 0).toLocaleString()}`);
    }

    // 3. Анализ таблицы streams
    console.log('\n\n📺 ТАБЛИЦА: streams (Стримы)');
    console.log('-'.repeat(60));
    
    let streamsStats;
    try {
      streamsStats = await databaseService.query(`
        SELECT 
          COUNT(*) as total_streams,
          MIN(started_at) as first_stream,
          MAX(ended_at) as last_stream,
          SUM(questions_count) as total_questions_in_streams
        FROM streams
      `);
    } catch (error) {
      console.log('  Таблица streams не найдена или пуста');
      streamsStats = { rows: [{ total_streams: 0, total_questions_in_streams: 0 }] };
    }

    if (streamsStats.rows && streamsStats.rows.length > 0) {
      const stats = streamsStats.rows[0];
      console.log(`  Всего стримов: ${parseInt(stats.total_streams || 0).toLocaleString()}`);
      console.log(`  Вопросов в стримах: ${parseInt(stats.total_questions_in_streams || 0).toLocaleString()}`);
      console.log(`  Первый стрим: ${stats.first_stream || 'N/A'}`);
      console.log(`  Последний стрим: ${stats.last_stream || 'N/A'}`);
    }

    // 4. Анализ таблицы questions
    console.log('\n\n❓ ТАБЛИЦА: questions (Вопросы)');
    console.log('-'.repeat(60));
    
    let questionsStats;
    try {
      questionsStats = await databaseService.query(`
        SELECT 
          COUNT(*) as total_questions,
          COUNT(DISTINCT stream_id) as unique_streams,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(LENGTH(COALESCE(snippet, ''))) as avg_length
      FROM questions
      `);
    } catch (error) {
      console.log('  Таблица questions не найдена или пуста');
      questionsStats = { rows: [{ total_questions: 0, unique_streams: 0, unique_users: 0, avg_length: 0 }] };
    }

    if (questionsStats.rows && questionsStats.rows.length > 0) {
      const stats = questionsStats.rows[0];
      console.log(`  Всего вопросов: ${parseInt(stats.total_questions || 0).toLocaleString()}`);
      console.log(`  Уникальных стримов: ${stats.unique_streams || 0}`);
      console.log(`  Уникальных пользователей: ${parseInt(stats.unique_users || 0).toLocaleString()}`);
      console.log(`  Средняя длина: ${Math.round(stats.avg_length || 0)} символов`);
    }

    // 5. Анализ таблицы app_users (авторизованные пользователи)
    console.log('\n\n🔐 ТАБЛИЦА: app_users (Авторизованные пользователи приложения)');
    console.log('-'.repeat(60));
    
    const appUsersStats = await databaseService.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE google_id IS NOT NULL) as google_users,
        COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as email_users,
        MIN(created_at) as first_user,
        MAX(created_at) as last_user
      FROM app_users
    `);

    if (appUsersStats.rows && appUsersStats.rows.length > 0) {
      const stats = appUsersStats.rows[0];
      console.log(`  Всего пользователей: ${parseInt(stats.total_users || 0).toLocaleString()}`);
      console.log(`  Подтвержденных: ${parseInt(stats.verified_users || 0).toLocaleString()}`);
      console.log(`  Через Google: ${parseInt(stats.google_users || 0).toLocaleString()}`);
      console.log(`  Через Email: ${parseInt(stats.email_users || 0).toLocaleString()}`);
      console.log(`  Первый пользователь: ${stats.first_user || 'N/A'}`);
      console.log(`  Последний пользователь: ${stats.last_user || 'N/A'}`);
    }

    // 6. Анализ таблицы global_rules
    console.log('\n\n⚙️  ТАБЛИЦА: global_rules (Глобальные правила)');
    console.log('-'.repeat(60));
    
    const rulesStats = await databaseService.query(`
      SELECT 
        COUNT(*) as total_rules,
        COUNT(*) FILTER (WHERE enabled = true) as enabled_rules,
        rule_type,
        enabled,
        updated_at
      FROM global_rules
      ORDER BY rule_type
    `);

    if (rulesStats.rows && rulesStats.rows.length > 0) {
      console.log(`  Всего правил: ${rulesStats.rows.length}`);
      rulesStats.rows.forEach(row => {
        console.log(`    ${row.rule_type}: ${row.enabled ? 'Включено' : 'Выключено'} (обновлено: ${row.updated_at || 'N/A'})`);
      });
    }

    // 7. Размеры таблиц
    console.log('\n\n💾 РАЗМЕРЫ ТАБЛИЦ');
    console.log('-'.repeat(60));
    
    const tableSizes = await databaseService.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as columns_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('messages', 'users', 'streams', 'questions', 'app_users', 'global_rules', 'user_settings', 'user_spam_rules')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    if (tableSizes.rows && tableSizes.rows.length > 0) {
      tableSizes.rows.forEach(row => {
        console.log(`  ${row.tablename}: ${row.size} (${row.columns_count} колонок)`);
      });
    }

    // 8. Скорость поступления данных (сообщений в час)
    console.log('\n\n📈 СКОРОСТЬ ПОСТУПЛЕНИЯ ДАННЫХ');
    console.log('-'.repeat(60));
    
    const rateStats = await databaseService.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as messages_per_hour,
        COUNT(DISTINCT stream_id) as streams_per_hour,
        COUNT(DISTINCT username) as users_per_hour
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
      LIMIT 24
    `);

    if (rateStats.rows && rateStats.rows.length > 0) {
      const avgMessages = rateStats.rows.reduce((sum, row) => sum + parseInt(row.messages_per_hour || 0), 0) / rateStats.rows.length;
      console.log(`  Среднее сообщений в час (за 24ч): ${Math.round(avgMessages).toLocaleString()}`);
      console.log(`  Пиковая нагрузка (за час): ${Math.max(...rateStats.rows.map(r => parseInt(r.messages_per_hour || 0))).toLocaleString()} сообщений`);
      
      if (rateStats.rows.length > 0) {
        console.log('\n  По часам (последние 6 часов):');
        rateStats.rows.slice(0, 6).forEach(row => {
          const hour = new Date(row.hour).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          console.log(`    ${hour}: ${parseInt(row.messages_per_hour || 0).toLocaleString()} сообщений, ${row.streams_per_hour || 0} стримов, ${row.users_per_hour || 0} пользователей`);
        });
      }
    }

    // 9. Прогноз роста данных
    console.log('\n\n🔮 ПРОГНОЗ РОСТА ДАННЫХ');
    console.log('-'.repeat(60));
    
    const growthStats = await databaseService.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as daily_messages
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    if (growthStats.rows && growthStats.rows.length >= 2) {
      const dailyAvg = growthStats.rows.reduce((sum, row) => sum + parseInt(row.daily_messages || 0), 0) / growthStats.rows.length;
      const monthly = dailyAvg * 30;
      const yearly = dailyAvg * 365;
      
      console.log(`  Среднее сообщений в день (за 7 дней): ${Math.round(dailyAvg).toLocaleString()}`);
      console.log(`  Прогноз на месяц: ${Math.round(monthly).toLocaleString()} сообщений`);
      console.log(`  Прогноз на год: ${Math.round(yearly).toLocaleString()} сообщений`);
      console.log(`  Примерный размер за год: ~${(Math.round(yearly) * 200 / 1024 / 1024).toFixed(2)} MB (при среднем размере 200 байт на сообщение)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Анализ завершен!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

analyzeDataVolumes();


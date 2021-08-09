const { createSampleApp } = require('../factory')

const parser = createSampleApp()

it('should ping in verbose mode', async () => {
    const context = await parser.parse(['ping', '-v'])
    expect(context).toHaveProperty('options')
    expect(context).toHaveProperty('command')
    expect(context).toHaveProperty('group', undefined)
    expect(context.command).toHaveProperty('key', 'ping')
    expect(context.options).toHaveProperty('verbose', true)
    expect(context.options).toHaveProperty('quiet', false)
    expect(context.options).toHaveProperty('api-host', 'http://localhost:3000')
    expect(context.options).toHaveProperty('config-dir', '/etc/cafe')
})

it('should upload with alias to custom host in quiet mode', async () => {
    const context = await parser.parse(['file', 'up', 'data.tar.gz', '-n', '4000Unclassified', '-q', '--api-host', 'https://cdn.data.local:8080'])
    expect(context).toHaveProperty('command')
    expect(context).toHaveProperty('group')
    expect(context).toHaveProperty('options')
    expect(context).toHaveProperty('arguments')
    expect(context.group).toHaveProperty('key', 'file')
    expect(context.command).toHaveProperty('key', 'upload')
    expect(context.options).toHaveProperty('verbose', false)
    expect(context.options).toHaveProperty('quiet', true)
    expect(context.options).toHaveProperty('name', '4000Unclassified')
    expect(context.options).toHaveProperty('api-host', 'https://cdn.data.local:8080')
    expect(context.options).toHaveProperty('config-dir', '/etc/cafe')
    expect(context.arguments).toHaveProperty('path', 'data.tar.gz')
})

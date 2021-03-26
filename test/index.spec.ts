import cli from '../src'
import { TestCommand, TestCommand10, TestCommand11, TestCommand12, TestCommand13, TestCommand4, TestCommand6, TestCommand8, TestCommand9 } from './test-commands'
import { getCommandInstance } from '../src/utils'

describe('Test Command classes', () => {
  let consoleMessages: string[] = []
  const consoleErrors: string[] = []

  beforeAll(() => {
    global.console.log = jest.fn((message) => {
      consoleMessages.push(message)
    })
    jest.spyOn(global.console, 'warn')
    global.console.error = jest.fn((message) => {
      consoleErrors.push(message)
    })
  })

  beforeEach(() => {
    //clear stored console messages
    consoleMessages = []
  })

  it('should run LeafCommand run method', async () => {
    const commandKey = 'testCommand9'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand9],
      testArguments: [ commandKey ],
    })

    const command: TestCommand9 = commandBuilder.initedCommands[0].command as TestCommand9

    expect(command.name).toBe(commandKey)
    expect(consoleMessages[0]).toBe(`I'm the testCommand ${commandKey}`)
  })

  it('should set cli option of Command instance', async () => {
    const commandKey = 'testCommand8'
    const commandOptionValue = 'testOptionValue8'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand8],
      testArguments: [ commandKey, '--option-test-command-8', commandOptionValue ],
    })
    const command: TestCommand8 = commandBuilder.initedCommands[0].command as TestCommand8

    expect(command.option1).toBe(commandOptionValue)
    expect(consoleMessages[0]).toBe(`I'm the testCommand ${commandKey}. option-test-command-8: ${commandOptionValue}`)
  })

  it('should set cli argument of Command instance', async () => {
    const commandArgumentValue = 'I COMMAND!!!!'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand4],
      testArguments: [ 'testCommand4', commandArgumentValue ],
    })
    const command: TestCommand4 = commandBuilder.initedCommands[0].command as TestCommand4

    expect(command.argument1).toBe(commandArgumentValue)
  })

  it('should set externally defined cli option default value to Command instance\'s field', async () => {
    const optionValue = 'http://obeying-service.local'
    const optionKey = 'api-url'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand6],
      testArguments: [ 'testCommand6' ],
      optionParameters: [
        {
          key: optionKey,
          describe: 'URL of the EP that I will Command!',
          default: optionValue,
        },
      ],
    })
    const command: TestCommand6 = commandBuilder.initedCommands[0].command as TestCommand6

    expect(command.apiUrl).toBe(optionValue)
  })

  it('should set passed externally defined cli option value to Command instance\'s field', async () => {
    const optionValue = 'http://obedient-service.local'
    const optionKey = 'api-url'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand6],
      testArguments: [ 'testCommand6', `--${optionKey}`, optionValue ],
      optionParameters: [
        {
          key: optionKey,
          describe: 'URL of the EP that I will Command!',
        },
      ],
    })
    const command: TestCommand6 = commandBuilder.initedCommands[0].command as TestCommand6

    expect(command.apiUrl).toBe(optionValue)
  })

  it('should use GroupCommand and call one of its LeafCommand (depth: 3)', async () => {
    //also use alias of the rootCommand
    //also fetch parent command option in leaf command
    const testCommand3OptionValue = 'BUT DO LIKE IN OTHER WAY NOW!'
    const testCommand3OptionKey = 'option-test-command-3'
    const leafCommandName = 'testCommand9'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand],
      testArguments: [ 'tst', `testCommand3`, leafCommandName, `--${testCommand3OptionKey}`, testCommand3OptionValue ],
    })
    const command: TestCommand9 = commandBuilder
      .initedCommands[0]
      .subCommands[0]
      .subCommands[1]
      .command as TestCommand9

      expect(consoleMessages[0]).toBe(`I'm the testCommand ${leafCommandName}`)
      expect(command.optionTestCommand3).toBe(testCommand3OptionValue)
  })

  it('should run async operation on command class then wait for it', async () => {
    const commandKey = 'testCommand10'
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand10],
      testArguments: [ commandKey ],
    })
    commandBuilder.initedCommands[0].command as TestCommand10

    expect(consoleMessages[0]).toBe(`I'm the testCommand ${commandKey}`)
  })

  it('should reach aggregated command fields', async () => {
    const aggregatedArgument1 = 'I COMMAND!!!!'
    const cliPath = ['testCommand11', `testCommand12`]
    const commandBuilder = await cli({
      rootCommandClasses: [TestCommand11],
      testArguments: [ cliPath[0], cliPath[1], aggregatedArgument1, `--option-test-command-4` ],
    })
    const command: TestCommand12 = getCommandInstance(commandBuilder.initedCommands, cliPath) as TestCommand12

    expect(consoleMessages[0]).toBe(`I'm the testCommand ${cliPath[1]}`)
    expect(command.aggregatedRelation.name).toBe('testCommand4')
    expect(consoleMessages[1]).toBe(`Aggregated relation "argument1" value: ${aggregatedArgument1}`)
    expect(consoleMessages[2]).toBe(`Aggregated relation "option1" value: true`)
  })

  describe('should allow either one of the defined contained params', () => {
    const cliPath = [ `testCommand13` ]
    it('check only with the first param', async () => {
      const cliCommand1 = [ ...cliPath, `--option1`, 'whatever' ]
      await cli({
        rootCommandClasses: [TestCommand13],
        testArguments: [...cliCommand1],
      })

      expect(consoleMessages[0]).toBe(`I'm the testCommand ${cliCommand1[0]}`)
      expect(consoleMessages[1]).toBe(`Aggregated relation "option1" value: ${cliCommand1[2]}`)
      expect(consoleMessages[2]).toBe(`Aggregated relation "option2" value: undefined`)
    })

    it('check only with the second param', async () => {
      const cliCommand2 = [ ...cliPath, `--option2`, 'whatever' ]
      await cli({
        rootCommandClasses: [TestCommand13],
        testArguments: [...cliCommand2],
      })

      expect(consoleMessages[0]).toBe(`I'm the testCommand ${cliCommand2[0]}`)
      expect(consoleMessages[1]).toBe(`Aggregated relation "option1" value: undefined`)
      expect(consoleMessages[2]).toBe(`Aggregated relation "option2" value: ${cliCommand2[2]}`)
    })

    it('has to throw error when using both params at the same time', async () => {
      const cliCommand = [ ...cliPath, `--option1`, 'whatever', `--option2`, 'whatever' ]
      await expect(cli({
        rootCommandClasses: [TestCommand13],
        testArguments: [...cliCommand],
      })).rejects.toThrow('Arguments option1 and option2 are mutually exclusive')
    })
  })
})
